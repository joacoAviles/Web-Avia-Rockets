"""Supervise the private desktop; Chromium keeps its normal sandbox enabled."""
import os
import fcntl
from pathlib import Path
import signal
import socket
import subprocess
import time

# This managed volume must have one supervisor. The OS releases this lock
# after a crash, allowing stale Chromium singleton symlinks to be archived.
profile = Path('/profile')
profile_lock = (profile / '.avia-supervisor.lock').open('a')
fcntl.flock(profile_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
stale = [profile / name for name in ('SingletonLock', 'SingletonSocket', 'SingletonCookie')
         if (profile / name).is_symlink()]
if stale:
    archive = profile / ('.stale-locks-' + str(time.time_ns()))
    archive.mkdir(mode=0o700)
    for path in stale:
        path.rename(archive / path.name)

children = []
browser_process = None


def launch(argv):
    process = subprocess.Popen(argv)
    children.append(process)
    return process


def stop(*_):
    raise SystemExit(0)


def wait_port(port):
    for _ in range(120):
        if any(p.poll() is not None for p in children):
            raise RuntimeError('Desktop process exited during startup')
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=.2):
                return
        except OSError:
            time.sleep(.25)
    raise RuntimeError('Desktop startup timed out')


signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
try:
    launch(['Xtigervnc', ':99', '-geometry', '1280x720', '-depth', '24',
            '-localhost', 'yes', '-rfbport', '5900', '-SecurityTypes', 'None',
            '-AlwaysShared', '-AcceptSetDesktopSize', '-nolisten', 'tcp'])
    for _ in range(100):
        if os.path.exists('/tmp/.X11-unix/X99'):
            break
        time.sleep(.1)
    else:
        raise RuntimeError('Display unavailable')
    launch(['openbox'])
    browser_process = launch(['chromium', '--user-data-dir=/profile', '--remote-debugging-address=127.0.0.1',
            '--remote-debugging-port=9222', '--no-first-run', '--no-default-browser-check',
            '--start-fullscreen', '--restore-last-session',
            '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows'])
    wait_port(9222)
    wait_port(5900)
    launch(['websockify', '127.0.0.1:6080', '127.0.0.1:5900'])
    wait_port(6080)
    launch(['python3', '-m', 'uvicorn', 'gateway:app', '--host', '0.0.0.0', '--port', '8080',
            '--workers', '1', '--no-access-log'])
    while all(p.poll() is None for p in children):
        time.sleep(1)
    raise RuntimeError('Infrastructure process exited; container must restart')
finally:
    # Let Chromium flush cookies and session data while its display is still alive.
    if browser_process is not None and browser_process.poll() is None:
        browser_process.terminate()
        try:
            browser_process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            browser_process.kill()
    for process in reversed(children):
        if process.poll() is None:
            process.terminate()
    for process in children:
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()

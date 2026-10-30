FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium chromium-sandbox xvfb x11vnc openbox novnc websockify ca-certificates fonts-liberation \
    python3 python3-fastapi python3-uvicorn python3-httpx python3-websockets tini \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 browser \
    && mkdir -p /profile /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix && chown browser:browser /profile
WORKDIR /opt/infra
COPY gateway.py policy.py start.py test_policy.py test_gateway.py ./
COPY viewer.html /usr/share/novnc/avia.html
USER browser
ENV DISPLAY=:99 HOME=/home/browser
EXPOSE 8080
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["python3", "start.py"]

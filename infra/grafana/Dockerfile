FROM grafana/grafana:11.0.0

ENV GF_AUTH_ANONYMOUS_ENABLED=false \
    GF_AUTH_BASIC_ENABLED=true \
    GF_SERVER_HTTP_PORT=3000

COPY provisioning /etc/grafana/provisioning

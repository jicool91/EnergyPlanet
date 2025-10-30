FROM grafana/grafana:11.0.0

ENV GF_AUTH_ANONYMOUS_ENABLED=false \
    GF_AUTH_BASIC_ENABLED=true \
    GF_SERVER_HTTP_PORT=3000 \
    GF_SECURITY_ADMIN_USER=${GF_ADMIN_USER:-admin} \
    GF_SECURITY_ADMIN_PASSWORD=${GF_ADMIN_PASSWORD:-admin}

COPY provisioning /etc/grafana/provisioning

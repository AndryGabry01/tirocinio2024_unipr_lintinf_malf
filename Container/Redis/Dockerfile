FROM redis:alpine
# Espone la porta
EXPOSE 6379 
COPY redis.conf /usr/local/etc/redis/redis.conf

# Modifica le impostazioni di sistema per overcommit_memory
RUN echo "vm.overcommit_memory=1" >> /etc/sysctl.conf

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]

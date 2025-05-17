#!/usr/bin/env bash

# Script de instalación de Docker y Docker Compose en Ubuntu Server
# Requiere permisos de sudo

set -euo pipefail

# 1. Actualizar el índice de paquetes
echo "Actualizando índice de paquetes..."
sudo apt-get update -y

# 2. Instalar dependencias necesarias
echo "Instalando paquetes necesarios..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. Añadir la clave GPG oficial de Docker
echo "Añadiendo clave GPG de Docker..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. Configurar el repositorio estable de Docker
echo "Configurando repositorio de Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Actualizar e instalar Docker Engine y componentes
echo "Instalando Docker Engine y componentes..."
sudo apt-get update -y
sudo apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

# 6. Añadir el usuario 'ubuntu' al grupo 'docker' para uso sin sudo
echo "Agregando usuario 'ubuntu' al grupo 'docker'..."
sudo groupadd --force docker
sudo usermod -aG docker ubuntu

echo "Configurando permisos para que el grupo docker pueda usar el socket..."
sudo chown root:docker /var/run/docker.sock
sudo chmod 660 /var/run/docker.sock

# 7. Verificar la instalación
echo "Verificando las versiones instaladas..."
sudo docker --version
docker compose version

echo -e "\nDocker y Docker Compose se han instalado correctamente."
echo "Recuerda cerrar sesión y volver a iniciarla para aplicar los cambios de grupo."

sudo newgrp docker

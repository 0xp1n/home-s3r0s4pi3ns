---
external: false
draft: false
title: Hardening Ubuntu Server 22.04.2 LTS en 2023
description: Encuentra las mejores prácticas para fortificar tu servidor linux y evitar vectores de ataques comunes.
date: 2023-03-07
---

- [Introduccion](#introduccion)
- [Entorno de trabajo](#entorno-de-trabajo)
  - [Leer si usas MacOS ARM64](#leer-si-usas-macos-arm64)
  - [Instalacion](#instalacion)
  - [Buenas practicas separando particiones](#buenas-practicas-separando-particiones)
    - [/tmp](#tmp)
    - [/var \*](#var-)
  - [Servidor instalado, primeros pasos](#servidor-instalado-primeros-pasos)
- [Fuentes](#fuentes)

# Introduccion

Este es un tema que personalmente me gusta mucho y disfruto en el proceso, me parece un entrenamiento extra para aquellos que están entrenandose en seguridad ofensiva y se empiecen a familiarizar con la seguridad que estos servidores puedan tener.

Despues de realizar unos cuantos CTFs siempre me ha parecido que falta la parte de evasión y ocultación del atacante. Es cierto que en la gran mayoría no es su propósito principal y se enfoca en aprender mediante la práctica ciertas técnicas que se pueden aplicar en entornos reales pero no nos olvidemos que una auditoría de seguridad también debería contemplar la detección de intrusiones y consecuente evasión - ocultación por parte del red teamer.

# Entorno de trabajo

Esto ya depende del sistema operativo y hardware con el que te sientas cómodo, yo personalmente he virtualizado un [Ubuntu Server 22.04.2](https://ubuntu.com/download/server) usando Windows como host principal. La idea es que puedas revertir los cambios o empezar de nuevo si has desconfigurado o reventado el servidor por así decirlo ya que es posible que a la primera no nos salga todo como esperabamos.

## Leer si usas MacOS ARM64

Ahora que hay mas soporte para la architectura arm64 tenemos disponible la imagen iso [Ubuntu Server ARM](https://ubuntu.com/download/server/arm) y puedes utilizar [](https://mac.getutm.app/) para virtualizar. Si vas a utilizar MacOS para seguir este tutorial, te recomiendo echarle un vistazo a [este vídeo](https://www.youtube.com/watch?v=k1nYeqj2Kmk) si ves que no consigues instalarlo.

El truco está en apagar la máquina una vez terminaste la instalación y reiniciaste _(verás que se queda con la pantalla en negro y el cursor parpadeando)_ para poder limpiar la unidad de disco CD/DVD una vez terminada la instalación.

## Instalacion

Todo empieza aquí, si ya dejamos todo preparado desde el principio nos ahorraremos mucho trabajo mas tarde. Aun así, el disco duro se puede particionar con el servidor ya en funcionamiento o instalado y como te darás cuenta, será mas tedioso.

Como el proceso de instalación suele ser el mismo para todas las distros, no adjuntaré pantallazos pero si los pasos que he tomado yo:

- He definido el lenguaje del sistema como English y el layout del keyboard en Spanish _(llámame internacional)_
- He elegido una instalación UbuntuServer y no instalado drivers de terceros _(sería una buena alternativa tirar por la configuración mínima pero esta pensada para servidores en los que usuarios reales no van a estar constantemente entrando)_
- La interfaz de red la configura sola y la ip será de clase distinta segun utilizes NAT o bridge, a mi me gusta definir el adaptor de red en modo bridge para que imite la máquina virtual como si fuera un dispositivo físico mas en mi red.
- No he definido un proxy ni alternativas de mirrors
- Selecciona **'Custom storage layout'** en este paso y aplica [Buenas practicas separando particiones](#buenas-practicas-separando-particiones)
- He encriptado el [LVM group](https://linuxhandbook.com/lvm-guide/) con [LUKS](https://en.wikipedia.org/wiki/Linux_Unified_Key_Setup) y he definido una passphrase para poder desencriptar el contenido, no se nota casi nada en el rendimiento del servidor y si alguien se llevara el contenido buena suerte desencriptándolo.
- Define el nombre del servidor el usuario principal como desees
- He dicho si al instalar OPENSSH y no he instalado custom third party services
- De los feature snaps no he instalado ninguno _(quizás te interese docker)_

Ahora solo queda esperar hasta que salga la opción **Reboot now**, deja que termine de actualizar ya que antes verás la opción **Cancel update and reboot**

---

## Buenas practicas separando particiones

Toma esta información como referencia, depende mucho del contexto del servicio que se este ofreciendo, en la mayoría de casos esta separación de particiones es la recomendada para cualquier servidor de linux ya que separamos el código ejecutable de los datos de lectura. Esta práctica también nos evita que se llene el disco duro inesperadamente al estar todo en el mismo lugar pudiendo dar lugar a una denegación de servicio propia (lol).

El tamaño puede variar segun el tamaño de disco que hayas asignado a la máquina, en la imagen podrás ver que se le asigna 10 gigas a `/home` y despues de separar las otras particiones con tamaño estandar de 2G para SWAP y 1G para las otras, redirige el restante a la raiz `/`

Se recomienda tener las siguientes particiones definidas en el sistema en formato `ext4` que garantiza unas características de seguridad minimas en sistemas linux:
![Particiones](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/af8a74ce-2033-4447-8242-1394cc484c3c/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230307%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230307T120343Z&X-Amz-Expires=86400&X-Amz-Signature=98bed614aaf0a8bf0de8003b57ee7d5bd41560b395301b4c5a727bca5d56e351&X-Amz-SignedHeaders=host&response-content-disposition=filename%3D%22Untitled.png%22&x-id=GetObject)

### /tmp

Este es un directorio que puede utilizar cualquier usuario del sistema y para evitar el agotamiento de recursos por excesivo almacenamiento de ficheros temporales se separa en otra partición. El tamaño recomendado es de 1 giga

### /var \*

Es usado por los demonios y otros servicios del sistema para almacenar datos dinámicos, algunos de los directorios contenidos pueden tener permisos de acceso y escritura para todos los usuarios del sistema.

**/var/log/audit** esta orientado para los logs del sistema que auditaremos con [auditd](https://www.man7.org/linux/man-pages/man8/auditd.8.html)

## Servidor instalado, primeros pasos

El primer paso que daremos una vez hayamos inicado sesión con el usuario que hemos definido en el proceso de instalación es aplicar unas reglas de seguridad en el archivo de configuración `/etc/fstab` para cada una de las particiones que hemos definido como muestro en la siguiente imagen cortesía de Incibe:
![fstab_config](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/b0847eec-fa44-45a4-9f1d-d6098d9c2b37/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230307%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230307T140134Z&X-Amz-Expires=86400&X-Amz-Signature=3f59d4d10a64db30d3b90d4b63b84b2e2c3e92d4945eee9e76a14226764aa8f0&X-Amz-SignedHeaders=host&response-content-disposition=filename%3D%22Untitled.png%22&x-id=GetObject)

No explicaré cada regla ya que las puedes encontrar en la man page de mount, accediendo con `man mount` pero te dejaré algunas por aquí:

- **nodev** Do not interpret character or block special devices on the file system. This option is useful for a server that has
  file systems containing special devices for architectures other than its own.

- **noexec** Do not allow execution of any binaries on the mounted file system. This option is useful for a server that has file
  systems containing binaries for architectures other than its own.

- **nosuid** Do not allow set-user-identifier or set-group-identifier bits to take effect.

# Fuentes

- [INCIBE - Seminario Hardening básico de Linux](https://www.youtube.com/watch?v=YZnkAWdXB4s)

- [Linux security checklist](https://linuxsecurity.expert/checklists/linux-security-and-system-hardening)

- [Ubuntu server hardening quick guide](https://linux-audit.com/ubuntu-server-hardening-guide-quick-and-secure/)

- [Nuharbor security Ubuntu server hardening guide](https://www.nuharborsecurity.com/ubuntu-server-hardening-guide-2/)

- [Linux security](https://www.cyberciti.biz/tips/linux-security.html)

- [Linux handbook - SSH Hardening tips](https://linuxhandbook.com/ssh-hardening-tips/)

- [LVM Guide](https://linuxhandbook.com/lvm-guide/)

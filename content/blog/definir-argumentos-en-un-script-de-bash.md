---
external: false
draft: false
title: Definir argumentos en un script de bash
description: Si tenías la curiosidad de como se crean las herramientas de bash que te permiten pasar como parámetro opciones específicas este es tu lugar
date: 2023-03-01
---

### Índice

- [getopts vs getopt](#getopts-vs-getopt)
- [Soporte para opciones con formato doble guion](#soporte-para-opciones-con-formato-doble-guion)
- [Creando nuestro script basico listo para la batalla](#creando-nuestro-script-basico-listo-para-la-batalla)
- [Dando soporte al formato largo](#dando-soporte-al-formato-largo)
- [Compilando nuestro script con shc](#compilando-nuestro-script-con-shc)
  - [Importante](#importante)

---

**_Los conceptos que aquí expongo los aplico en mi herramienta [linuxladder](https://github.com/0xp1n/linuxladder)_**

Si tienes curiosidad de como se construyen los comandos o tienes intención de crear tu propia herramienta en bash sigue leyendo. Te explicaré de forma sencilla como empezar el esqueleto que recojerá los argumentos del usuario y transformarlo en funcionalidades dentro de tu script.

`Se requiere que tengas conocimientos previos de:`

- **_Linux_**
- **_Bash scripting_**

## getopts vs getopt

Cuando aparece este tipo de debates yo en mi opinión personal siempre me decanto por la solución mas estandarizada y que tiene un rango de soporte mas amplio. En este tutorial usaremos **getopts** porque es un built-in de la shell siguiendo las directrices de [POSIX](https://pubs.opengroup.org/onlinepubs/7908799/xcu/getopts.html) mientras que **getopt** es un binario que dispone de múltiples versiones.

Lo podemos comprobar fácilmente usando otro built-in `type` en tu shell de confianza:

```bash
type getopt
# type is /usr/bin/geopt

type getopts
# type is a shell built-in
```

## Soporte para opciones con formato doble guion

Desafortunadamente `geopts` no soporta pasar opciones en formato largo como podría ser **--version** pero no te preocupes, parsearemos manualmente estos inputs para transformarlos a la opción corta correspondiente. Dentro de nuestro script, el flag **--version** se convertiría a **-v** sin que el usuario note ningun cambio en la ejecución.

## Creando nuestro script basico listo para la batalla

Usaremos el entorno de nuestro sistema para ubicar nuestro binario de bash en lugar del típico `/bin/bash`, recuerda este pequeño detalle que expongo aquí porque será importante a la hora de compilar nuestro script y convertirlo en un binario ejecutable al final de este tutorial.

Creamos nuestro fichero y le damos permisos de ejecución para tenerlo ya listo:

```bash
touch script.sh && chmod +x script.sh
```

Definimos la primera pieza de código que nos permitirá parsear una opción que mostrará la ayuda de nuestra herramienta:

```bash
#!/usr/bin/env bash

# Read user options
while getopts ":h:" arg; do
    case $arg in
        h | *)
            echo "HELP ME!"
        ;;
    esac
done
```

El comportamiento que he definido de momento para el caso `h | *` es que si se le pasa cualquier otra opción que no este definida en **OPTSTRING** de **geotpts** realize el comportamiento de la opción **h** que sería mostrar ese pequeño mensaje de ayuda en lugar de lanzar un **<option> not supported**.

Se libre de elegir el comportamiento que mejor se adapte a tu herramienta.

```bash
bash script.sh # Nada se muestra de momento

bash script.sh -i # HELP ME!
bash script.sh -h # HELP ME!
```

La sintáxis de la definición de comandos en `getopts` es un poco especial por lo que te dejaré por aquí la página de **man** que lo explica en detalle mejor que yo:

```bash
# getopts OPTSTRING VARNAME [ARGS...]

# where:

#     OPTSTRING is string with list of expected arguments,
#         h - check for option -h without parameters; gives error on unsupported options;
#         h: - check for option -h with parameter; gives errors on unsupported options;
#         abc - check for options -a, -b, -c; gives errors on unsupported options;

#         :abc - check for options -a, -b, -c; silences errors on unsupported options;

#         Notes: In other words, colon in front of options allows you handle the errors in your code. Variable will contain ? in the case of unsupported option, : in the case of missing value.
```

## Dando soporte al formato largo

Para ello deberemos crear otro caso que soporte una option distinta ya que la opción de help ahora mismo no nos permitiría ver si el parseo se esta aplicando correctamente aunque lo definamos ya que si la opción no es soportada en nuestro script, siempre llamará al trozo de código dentro de `case h | *)`.

El concepto es sencillo, usaremos el parámetro especial `$@` que nos permite obtener un array que contiene los argumentos pasados al script, iterarlos y transformarlos en la opción soportada por nuestro `getopts`

```bash
#!/usr/bin/env bash

# Translate wide-format options into short ones
for arg in "$@"; do
  shift

  case "$arg" in
    '--help')      set -- "$@" '-h'   ;;
    '--index')     set -- "$@" '-i'    ;;
    *)             set -- "$@" "$arg" ;;
  esac
done

# Read user options
while getopts ":ih:" arg; do
    case $arg in
        i)
            echo "SUPPORTED -i option"
        ;;
        h | *)
            echo "HELP ME!"
        ;;
    esac
done

shift $(( OPTIND - 1)) # remove options from positional parameters
```

Al ejecutarlo verás que aun no tiene el comportamiento que deseamos, tendrías que ver algo similar a esto:

```bash
bash script.sh --index
HELP ME!
SUPPORTED -i option
HELP ME!
HELP ME!
HELP ME!
HELP ME!
SUPPORTED -i option

```

Esto es porque esta interpretando todo lo que hay del primer **-** en adelante como si fueran distintas opciones y los lee como argumentos separados similar a lo que hace `ls -la` pudiendo interpretar varias opciones en conjunto. De forma visual estaría recibiendo un array así **[- -i n d e x]**. Para solucionar este pequeño inconveniento tiraremos de otro built-in llamado `shift`. Puedes encontrar información mas detallada del funcionamiento de shift en [este enlace](https://www.computerhope.com/unix/bash/shift.htm)

```bash
#!/usr/bin/env bash

# Translate wide-format options into short ones
for arg in "$@"; do
  shift

  case "$arg" in
    '--help')      set -- "$@" '-h'   ;;
    '--index')     set -- "$@" '-i'    ;;
    *)             set -- "$@" "$arg" ;;
  esac
done

# Read user options
while getopts ":ih:" arg; do
    case $arg in
        i)
            echo "SUPPORTED -i option"
        ;;
        h | *)
            echo "HELP ME!"
        ;;
    esac
done

shift $(( OPTIND - 1)) # remove options from positional parameters
```

Ahora si tiene el comportamiento que nosotros deseamos:

```bash
bash script.sh --index
# SUPPORTED -i option

```

## Compilando nuestro script con shc

En principio, el objetivo de este tutorial lo hemos conseguido, que era interpretar las opciones que recibe nuestro script y ejecutar la funcionalidad correspondiente. Es tan simple como reemplazar los **echo** por tus funciones, comandos, otros scripts, etc.

Le podemos dar un toque extra y compilarlo para convertirlo en un ejecutable portable que es lo que haremos con la herramienta `shc`

### Importante

¿Recuerdas [este parrafo](#creando-nuestro-script-básico-listo-para-la-batalla) donde te pedía que tomaras nota de un detalle? Esto es porque a la hora de compilar nuestro script, la librería `shc` [a día de hoy](https://github.com/neurobin/shc/issues/21) no tiene soporte para el shebang `#!/usr/bin/env bash`:

```bash
shc -f script.sh
# Te saldrá un mensaje como este al tener definido #!/usr/bin/env bash
shc Unknown shell (expect): specify [-i][-x][-l]
```

Por lo que si queremos aplicar este paso extra debemos cambiar el shebang de nuestro script por `/bin/bash`:

```bash
shc -f script.sh
#shc:success

```

Si ya has cambiado el shebang en tu script, shc debería haberte generado 2 archivos adicionales, `script.sh.x.c` y `script.sh.x` donde a nosotros solo nos interesa este último que es el compilado ejecutable. Se puede obtener directamente el binario sin generar el código fuente en c de la siguiente forma:

```bash
shc -f -script.sh -o script
```

Ten en cuenta que tomará la architectura de tu sistema a la hora de compilarlo, en mi MacOs con chip M1 tengo el siguiente resultado, el cual, sería incompatible con otras architecturas como x86_64:

```bash
file script

script: ELF 64-bit LSB pie executable, ARM aarch64, version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux-aarch64.so.1, BuildID[sha1]=e83971f02c08ae509ee486b95ad74d16ff1a5005, for GNU/Linux 3.7.0, stripped
```

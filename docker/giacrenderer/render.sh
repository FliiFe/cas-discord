#!/bin/bash

# One command per line
sed s/\;/\\n/g >/var/workspace/commands
cd /var/workspace || exit

# Clean up commands
sed -i -e 's/^[ \t]*//g' commands
sed -i -e 's/[ \t]*$//g' commands
echo >> commands

# Hang until `promt#>` has appeared
waitforprompt() {
    while ! grep -q 'prompt#>' output; do
        sleep 0.1
    done
}

latexheader() {
    echo \
        '\documentclass{article}

    \usepackage[utf8]{inputenc}
    \usepackage[T1]{fontenc}
    \usepackage[a5paper]{geometry}
    \usepackage{color}
    \usepackage{xcolor}
    \usepackage{amsmath}
    \usepackage{framed}
    \usepackage{listings}

    \begin{document}
    \pagenumbering{gobble}

    \definecolor{tc}{HTML}{fafafa}
    \color{tc}

    \lstset{basicstyle=\ttfamily,breaklines=true}'
}

# Separate function to be able to pipe output into a file
runcommands() {
    # Create a background process, taking ./input as input outputting to ./output
    touch input output
    tail -f input | giac --texmacs 2>/dev/null >>output &
    waitforprompt
    n=1
    # Iterate over commands (linefeed-separated)
    while read -r line; do
        latexcommand "$line" | tee "result$n.tex" 1>&2
        latex "result$n.tex" 1>&2
        dvipng -D 200 -bg 'rgb 0.1725 0.1843 0.2' -o "result$n-%01d.png" "result$n.dvi" 1>&2
        mogrify -bordercolor '#2c2f33' -border 50x50 ./result$n-*.png 1>&2
        base64 result$n-*.png | tr -d '\n'
        echo
        n=$((n+1))
    done <commands
    echo "quit" >> input
}

latexcommand() {
    latexheader
    line=$1
    echo "Processing command: $line" 1>&2
    # Empty out output file
    : > output
    echo "$line" >> input
    # Wait for prompt to return
    waitforprompt
    echo  "\\begin{lstlisting}"
    echo "$line"
    echo "\\end{lstlisting}\\rule[0.3\\baselineskip]{\\linewidth}{0.5pt}"
    content=$(tr -dc '[:print:]' <output | sed 's/prompt#>//g' | sed -r s/^verbatim://g)
    type=$(echo "$content" | head -n 1 | cut -d: -f1)
    if [ "$type" = "verbatim" ]; then
        value=$(echo "$content" | sed s/^verbatim://g | sed 's/%/\\%/g')
        echo "\\begin{center}\\texttt{\\detokenize{$value}}\\end{center}"
    else
        echo "$content" | sed s/^latex://g \
            | perl -pe 's/(?<!\\left)((?<!\\)\[|\\\{|\()/\\left\1/g' \
            | perl -pe 's/(?<!\\right)((?<!\\)\]|\\\}|\))/\\right\1/g'
    fi
    echo "\\end{document}"
}

runcommands

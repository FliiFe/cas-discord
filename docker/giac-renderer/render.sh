#!/bin/bash

cat - > /var/workspace/commands
cd /var/workspace || exit

# One command per line
awk -v ORS="    " '1' commands >commands2
mv commands2 commands
sed -i s/\;/\\n/g commands

# Clean up commands
sed -i -e 's/^[ \t]*//g' commands
sed -i -e 's/[ \t]*$//g' commands
echo >> commands

cat commands 1>&2

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
    % \usepackage{xcolor}
    \usepackage{amsmath}
    \usepackage{framed}
    \usepackage{listings}
    % \usepackage{pstricks}
    % \usepackage{auto-pst-pdf}

    \begin{document}
    \pagenumbering{gobble}

    \definecolor{tc}{rgb}{0.980, 0.980, 0.980}
    \color{tc}

    \lstset{basicstyle=\ttfamily,breaklines=true}
    \noindent\begin{tabular}{l}
    \rule{\linewidth}{0pt} \\
    \multicolumn{1}{l}{'
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
        latexcommand "$line" >"result$n.tex" 
        cat "result$n.tex" 1>&2
        latex -interaction=nonstopmode -shell-escape "result$n.tex" 1>/dev/null
        # pdflatex --shell-escape --enable-write18 "result$n.tex" 1>&2
        dvipng -D 200 -bg 'rgb 0.1725 0.1843 0.2' -o "result$n-%01d.png" "result$n.dvi" 1>&2
        mogrify -bordercolor '#2c2f33' -border 50x50 ./result$n-*.png 1>&2
        base64 result$n-*.png | tr -d '\n'
        echo
        n=$((n+1))
    done <commands
    echo "quit" >> input
}

# Get the output of one command
runcommand() {
    : > output
    printf "Command: " 1>&2
    echo "$1" | tee -a input 1>&2
    # Wait for prompt to return
    waitforprompt
    printf "Result: " 1>&2
    echo $(tr -dc '[:print:]' <output | sed 's/prompt#>//g' | sed -r 's/^verbatim://g') | tee /dev/stderr
}

# Get the latex representation of the nonevaluated input
get_noeval() {
    cmd="$1"
    echo "Running '$cmd' with no evaluation" 1>&2
    # eval_level=$(runcommand "eval_level()" | grep -o '[0-9]*') # Get only the number
    # echo "Eval level: "$eval_level 1>&2
    # runcommand "eval_level(0)" >/dev/null
    result=$(runcommand "quote( $cmd")
    # restore eval level
    # runcommand "eval_level(${eval_level})" >/dev/null
    echo $result
}

print_latex_output() {
    echo "$@" | sed s/^latex://g \
        | perl -pe 's/(?<!\\left)((?<!\\)\[|\\\{|\()/\\left\1/g' \
        | perl -pe 's/(?<!\\right)((?<!\\)\]|\\\}|\))/\\right\1/g' \
        | perl -pe "s/'/\\\\,\\\\!'/g" \
        | sed 's/\\\[/\\[\\displaystyle /g'
}

intermediate_latex() {
    echo '}\\
    \\ \hline \\
    \multicolumn{1}{r}{'
}

latexcommand() {
    latexheader
    line=$1
    # echo "Processing command: $line" 1>&2
    content=$(runcommand "$line")

    print_latex_output "$(get_noeval "$line")" # | tee /dev/stderr
    intermediate_latex

    type=$(echo "$content" | head -n 1 | cut -d: -f1)
    if [ "$type" = "verbatim" ]; then
        value=$(echo "$content" | sed s/^verbatim://g | sed 's/%/\\%/g')
        echo "\\begin{center}\\texttt{\\detokenize{$value}}\\end{center}"
    else
        print_latex_output "$content"
    fi
    echo '}
\end{tabular}
\end{document}'
}

runcommands

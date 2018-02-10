const Discord = require('discord.js');
const bot = new Discord.Client();
const { readFileSync } = require('fs');
const { token, prefix } = JSON.parse(readFileSync('./token.json'));
const exec = require('util').promisify(require('child_process').exec);
const { post } = require('axios');
const api = 'http://rtex.probablyaweb.site/api/v2';

bot.on('ready', () => console.log('ready !'));

bot.on('message', msg => {
    if (msg.author.bot) return;
    if (msg.content[0] !== prefix && !(msg.channel instanceof Discord.DMChannel)) return;
    if ([0, 1].indexOf(msg.content.indexOf('giac')) >= 0) {
        msg.channel.startTyping();
        const command = msg.content.split(' ').slice(1).join(' ');
        if (command.indexOf('help') === 0) {
            helpCommand(msg, command);
        } else {
            giacCommand(msg, command);
        }
    }
});

async function helpCommand(msg, command) {
    const output = await giacexec(command);
    const [help, syntax, seealso, examples] = output.split('<br>');
    const latex = giachelplatextemplace(syntax,
        help.split(' : ').slice(1).join(' '),
        seealso,
        examples.replace(/;/g, ';\n'));
    sendLatex(msg, latex);
}

async function giacCommand(msg, command) {
    const output = await giacexec(`latex(${command})`);
    const latex = giaclatextemplate(command, output);
    sendLatex(msg, latex);
}


async function giacexec(input) {
    // Use environment variable to let bash do the sanitizing
    const { stdout } = await exec('docker run discord-cas/giac "$USER_INPUT"', { env: { USER_INPUT: input } });
    // Remove doublequotes and ending newline
    return stdout.slice(1, -2);
}

async function renderLatex(code) {
    const { rawOutput } = await exec('docker run discord-cas/latexrenderer "$LATEX"', {env: {LATEX: code}});
}

async function sendLatex(msg, latex) {
    console.log(latex);
    const result = await post(api, {
        code: latex,
        format: 'png'
    });
    console.log('------ status:', result.data.status);
    if (result.data.status === 'success') {
        await msg.channel.send('', new Discord.Attachment(api + '/' + result.data.filename, 'giac.png'));
    } else {
        // console.log('------ pdflatex output:', result.data.log);
        await msg.channel.send('Error rendering the code');
    }
    msg.channel.stopTyping();
}

bot.login(token);

const giaclatextemplate2 = (input, output) => `
\\documentclass{article}

\\usepackage[a5paper]{geometry}
\\usepackage{color}
\\usepackage{xcolor}
\\usepackage{amsmath}
\\usepackage{framed}

\\begin{document}

\\definecolor{tc}{HTML}{fafafa}
\\color{tc}
\\definecolor{shadecolor}{HTML}{36393e}


\\begin{shaded}
    \\noindent\\texttt{\\detokenize{${input}}}\\\\
    \\rule[0.3\\baselineskip]{\\linewidth}{0.5pt}
    \\begin{flalign*}
    &&${output.replace(/(\\left)?(\[|\\{|\()/g, match => match.indexOf('\\left') === 0 ? match : '\\left' + match)
        .replace(/(\\right)?(]|\\}|\))/g, match => match.indexOf('\\right') === 0 ? match : '\\right' + match)}
    \\end{flalign*}
\\end{shaded}


\\pagenumbering{gobble}
\\end{document}
`;

const giaclatextemplate = (input, output) => `
\\documentclass{article}

\\usepackage[a5paper]{geometry}
\\usepackage{color}
\\usepackage{xcolor}
\\usepackage{amsmath}
\\usepackage{framed}
\\usepackage{pst-plot,color}
\\usepackage{graphicx}

\\begin{document}

${output}

\\pagenumbering{gobble}
\\end{document}
`;

const giachelplatextemplace = (syntax, help, seealso, examples) => `
\\documentclass{article}

\\usepackage[a5paper]{geometry}
\\usepackage{color}
\\usepackage{xcolor}
\\usepackage{amsmath}
\\usepackage{framed}

\\begin{document}

\\definecolor{tc}{HTML}{fafafa}
\\color{tc}
\\definecolor{shadecolor}{HTML}{2c2f33}


\\begin{shaded}
    \\noindent\\texttt{\\detokenize{${syntax}}}\\\\
    \\rule[0.3\\baselineskip]{\\linewidth}{0.5pt}
\\noindent \\detokenize{${help}}\\\\[1em]
\\textbf{See also:} \\texttt{\\detokenize{${seealso}}}\\\\[1em]
\\textbf{Examples: }
\\begin{verbatim}
${examples}
\\end{verbatim}
\\end{shaded}


\\pagenumbering{gobble}
\\end{document}
`;

process.on('uncaughtException', e => {
    console.log('Uncaught Exception...');
    console.trace(e);
});

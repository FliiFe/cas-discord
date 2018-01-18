const Discord = require('discord.js');
const bot = new Discord.Client();
const {readFileSync} = require('fs');
const {token, prefix} = JSON.parse(readFileSync('./token.json'));
const giac = require('./giac.js').cwrap('caseval', 'string', ['string']);
const { post } = require('axios');
const api = 'http://rtex.probablyaweb.site/api/v2';

bot.on('ready', () => console.log('ready !'));

bot.on('message', msg => {
    if(msg.author.id === bot.user.id) return;
    if(msg.content[0] !== prefix || (msg.channel instanceof Discord.DMChannel)) return;
    msg.channel.startTyping();
    if(msg.content.indexOf('giac') <= 1) {
        const command = msg.content.split(' ').slice(1).join(' ');
        if(command.indexOf('help') === 0) {
            helpCommand(msg, command);
        } else {
            giacCommand(msg, command);
        }
    }
});

function helpCommand(msg, command) {
    const [help, syntax, seealso, examples] = giac(command).slice(1, -1).split('<br>');
    const latex = giachelplatextemplace(syntax,
        help.split(' : ').slice(1).join(' '),
        seealso,
        examples.replace(/;/g, ';\n'));
    sendLatex(msg, latex);
}

function giacCommand(msg, command) {
    const output = giac(`latex(${command})`).slice(1,-1);
    const latex = giaclatextemplate(command, output);
    sendLatex(msg, latex);
}

function sendLatex(msg, latex) {
    console.log(latex);
    post(api, {
        code: latex,
        format: 'png'
    }).then(result => {
        console.log('------ status:', result.data.status);
        console.log('------ pdflatex output:', result.data.log);
        if(result.data.status === 'success'){
            msg.channel.send('', new Discord.Attachment(api + '/' + result.data.filename, 'giac.png'));
        } else {
            msg.channel.send('Error rendering the code');
        }
        msg.channel.stopTyping();
    }).catch(error => console.trace(error));
}

bot.login(token);

const giaclatextemplate = (input, output) => `
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

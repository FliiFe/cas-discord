const Discord = require('discord.js');
const bot = new Discord.Client();
const {readFileSync} = require('fs');
const {token} = JSON.parse(readFileSync('./token.json'));
const giac = require('./giac.js').cwrap('caseval', 'string', ['string']);
const { post } = require('axios');
const api = 'http://rtex.probablyaweb.site/api/v2';
const latextemplate = (input, output) => `
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
        &&${output}
    \\end{flalign*}
\\end{shaded}


\\pagenumbering{gobble}
\\end{document}
`;

bot.on('ready', () => console.log('ready !'));

bot.on('message', msg => {
    if(msg.content[0] !== '@') return;
    if(msg.content.indexOf('giac') === 1) {
        msg.channel.startTyping();
        const command = msg.content.split(' ').slice(1).join(' ');
        const output = giac(`latex(${command})`).slice(1,-1);
        const latex = latextemplate(command, output);
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
});

bot.login(token);

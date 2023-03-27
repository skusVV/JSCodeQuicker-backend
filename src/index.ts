import express, { Express } from 'express';
import {writeFileSync, readFileSync} from 'fs';
import dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    organization: process.env.ORGANIZATION,
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);


dotenv.config();
const app: Express = express();
const port = 3003;

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.listen(port, async () => {
  // eslint-disable-next-line
  console.log(
    `⚡️[server]: Server is running at https://localhost:${port}`,
  );
});

const rules: any = {
    testCoverage: `
        Can you cover this code with unit test?
        Please, apply next rules:
            1. Every expect statement be wrapped on "it".
            2. Not allowed use multiple expects in one "it" block.
            3. Use "Jest" library.
            4. Feel free to make an assumption regarding frameworks.
            5. For marcdown symbols use word \`\`\`javascript, not \`\`\`js. it's required to format code with Marcdown: \`\`\`javascript
`,
    simplifyCode: `
        Can you simplify this code?
        Please, apply next rules:
            1. It should be easy to read.
            2. Try not to use javascript methods that mutate state. Such as: push, pop, splice. Use pure methods.
            3. Feel free to create smaller functions if needed.
            4. Feel free to make an assumption regarding frameworks.
            5. For marcdown symbols use word \`\`\`javascript, not \`\`\`js. it's required to format code with Marcdown: \`\`\`javascript
            6. Use this styleguide for code: https://github.com/airbnb/javascript/blob/master/README.md  
            7. Use approach from functional Programming in Javascript           
            8. Move Magic numbers, string etc to constants. 
`
}

const extractCode = text => {
    return text.split('```javascript')[1].split('```')[0]
}

app.post('/api/v1/test-coverage', async (req: any, res: any) => {
    try {
        const { content, rulesType } = req.body;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: encodeURIComponent(content) + ( rules[rulesType] as string)}],
        });

        writeFileSync("counter.txt", String(Number(String(readFileSync("counter.txt"))) + 1));

        return res.send({content: extractCode(completion.data.choices[0].message.content)})
    } catch (e: any) {
        return res.send({content: 'Oooops. Try one more time.'});
    }
});


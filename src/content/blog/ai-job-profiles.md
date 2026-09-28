> **In short:** the AI roles hiring most today are AI/GenAI Engineer, Forward Deployed Engineer, Applied AI/ML Engineer, Agent/Automation Engineer and LLMOps/Platform Engineer. All of them still need strong programming and DSA. The fastest way in is to build and deploy two or three real AI projects, not to collect certificates.

"Learn AI" is vague advice. Companies don't hire someone to "know AI". They hire people into specific roles. Here are the AI job profiles that are in demand right now, what each one actually does, and how an Indian student can start preparing today.

## The big shift: from using AI to building with AI

Almost every developer now uses AI coding assistants. What companies are short of is engineers who can **build products and workflows on top of AI models**: connect them to real data, make them reliable, measure quality and ship them to users. That is where the new roles come from.

## 1. AI Engineer / Generative AI Engineer

**What they do**: build applications on top of large language models (LLMs), such as chatbots that answer from company documents, AI search, content tools and AI features inside existing apps.

**Day-to-day work**

- Prompt design and structured outputs
- **RAG (retrieval-augmented generation)**: embeddings, vector databases and retrieval
- **Tool calling and agents**: letting the model call APIs and take actions
- **Evaluations**: measuring whether answers are correct, and catching regressions
- Keeping cost and latency under control

**Core skills**: Python or TypeScript, REST APIs, one LLM API (Claude, OpenAI or Gemini), a vector database, and solid backend fundamentals.

**First project**: a "chat with your college syllabus" app that answers questions only from uploaded PDFs, cites the page, and says "I don't know" when the answer isn't there.

## 2. Forward Deployed Engineer (FDE)

**What they do**: a Forward Deployed Engineer works **directly with customers**, inside their teams, to take a product (increasingly an AI platform) and make it solve that customer's real problem. Palantir made the role famous, and many AI companies and startups now hire FDEs to get their technology working in production for clients.

**Day-to-day work**

- Understanding a client's workflow and turning it into a technical plan
- Writing production code: integrations, data pipelines, internal tools, AI workflows
- Dealing with messy real-world data and legacy systems
- Demos, explaining trade-offs, and handling feedback from non-technical stakeholders

**Core skills**: strong full-stack engineering, SQL and data modelling, APIs and integrations, LLM integration, and above all **communication and problem scoping**.

**Why it suits many Indian graduates**: if you like both coding and talking to people, this role rewards exactly that mix. Experience with client-facing engineering is a real advantage here.

**First project**: pick a real small business (a coaching centre, a clinic, a shop), understand one painful manual process, and automate it end to end with a small app plus an LLM. Write up the "before and after".

## 3. Applied AI / Machine Learning Engineer

**What they do**: train, fine-tune, evaluate and deploy models that solve business problems: recommendations, fraud detection, forecasting, document understanding and computer vision.

**Core skills**: Python, NumPy and Pandas, scikit-learn, PyTorch, statistics and model evaluation, and MLOps basics (serving a model as an API, monitoring).

**First project**: fine-tune a small pre-trained model (for example, a text classifier for complaint categories) and deploy it behind an API with a simple UI.

## 4. AI Agent / Automation Engineer

**What they do**: build **agents** that plan, call tools and complete multi-step tasks, and automations that connect AI to email, spreadsheets, CRMs and internal systems.

**Core skills**: tool and function calling, the Model Context Protocol (MCP), API integrations, workflow design, guardrails and human-in-the-loop checks, and logging agent behaviour so you can debug it.

**First project**: an agent that reads new internship listings, filters them by your skills, and drafts a tailored cover note for each (with you approving before anything is sent).

## 5. AI Solutions Engineer and LLMOps / AI Platform Engineer

- **AI Solutions Engineers** sit between sales and engineering: they design proof-of-concepts and help customers adopt an AI product. It's close to the FDE role, with more pre-sales work.
- **LLMOps / AI Platform Engineers** build the infrastructure: model gateways, caching, evaluation pipelines, monitoring, cost dashboards and security.

## Which role fits you?

| Role | You'll enjoy it if you like | Best first project |
| --- | --- | --- |
| AI / GenAI Engineer | Building products, backend work | A RAG app over real documents |
| Forward Deployed Engineer | Coding plus talking to users | Automate a real business process end to end |
| Applied AI / ML Engineer | Maths, data and experiments | Fine-tune and deploy a classifier |
| Agent / Automation Engineer | Workflows and integrations | A tool-using agent with human approval |
| LLMOps / Platform Engineer | Infrastructure and reliability | An LLM gateway with caching and logging |

## A preparation roadmap

1. **Get the fundamentals right**: one language well (Python or JavaScript), plus data structures and algorithms. AI roles still have coding rounds. Use our [DSA sheet](/dsa-sheet).
2. **Learn full-stack basics**: APIs, databases and deployment. Our [backend notes](/notes/node-express-basics) are a good start.
3. **Learn the LLM toolkit**: prompting, structured outputs, RAG, tool calling and evaluations.
4. **Build two or three real projects** and deploy them. A live link beats a certificate.
5. **Show your work**: write short posts about what you built, contribute to open-source AI projects (see [open-source programs](/opportunities#open-source)) and keep your GitHub active.

## FAQ

**Do I need a master's degree or advanced maths for these roles?**
Not for AI Engineer, Forward Deployed Engineer or Agent Engineer roles. They are software engineering roles that use AI models, so strong coding, APIs, databases and good judgement matter more. Applied ML roles do need more statistics and linear algebra, and research roles usually need a postgraduate degree.

**Python or JavaScript?**
Python has the richest AI and ML ecosystem. JavaScript/TypeScript is excellent for AI features inside web apps. Learn one well; you can pick up the other quickly.

**Is a Forward Deployed Engineer a sales job?**
No. It's an engineering job that writes production code, but in close contact with customers. You'll spend more time understanding problems and explaining trade-offs than a typical backend developer does.

**Will AI replace software engineers?**
AI tools already write a lot of routine code, which raises the bar: companies want engineers who can design systems, judge AI output, handle messy real-world data and take responsibility for what ships. Those are exactly the skills these roles are built on.

**What should I build first?**
One RAG app over real documents with citations, and one small agent that uses tools with a human approval step. Deploy both and write a short post about what broke and how you fixed it.

## Learn with us

Bitwise School is launching **Generative AI Engineering**, **Applied AI & Machine Learning** and a **Forward Deployed Engineer** track. See the complete [Generative AI Engineering course](/courses/generative-ai), the [courses page](/courses), and join the waitlist for the first batch.

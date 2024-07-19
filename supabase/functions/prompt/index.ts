// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import OpenAI from "https://deno.land/x/openai@v4.47.1/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import fm from "npm:front-matter@4.0.2";

// On github: https://raw.githubusercontent.com/expo/expo/main/docs/pages/get-started/start-developing.mdx
// Public page: https://docs.expo.dev/get-started/start-developing


const parseExpoDocs= async (slug:string)=>{
  const url=`https://raw.githubusercontent.com/expo/expo/main/docs/pages/${slug}.mdx`;
  const response= await fetch(url);
  const content= await response.text();
  const data= fm(content);
  return(data);
}

const openai = new OpenAI();

 const generateEmbeddings= async (input:string)=>{

  const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input,
      encoding_format: 'float',
    });
    const vector =embedding.data[0].embedding;
    return vector;
}
 const completion= async (prompt:string)=>{
  const response= await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
  })
  return response.choices[0];
}

const buildFullPrompt = (query: string, docsContext: string) => {
  const prompt_boilerplate =
    "Answer the question posed in the user query section using the provided context";
  const user_query_boilerplate = "USER QUERY: ";
  const document_context_boilerplate = "CONTEXT: ";
  const final_answer_boilerplate = "Final Answer: ";

  const filled_prompt_template = `
    ${prompt_boilerplate}
    ${user_query_boilerplate} ${query}
    ${document_context_boilerplate} ${docsContext} 
    ${final_answer_boilerplate}`;
  return filled_prompt_template;
};

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const {  query } = await req.json();

  // Generate Embedding for user query
  const vector = await generateEmbeddings(query);
  
  const {data: similarDocs, error}= await supabase.rpc("match_documents",{
    query_embedding :vector,
    match_threshold :0.20,
    match_count :2
 });
 const docs= await Promise.all(similarDocs.map(doc=> parseExpoDocs(doc.id)));
 const docsBodies=docs.map(doc=>doc.body);
 const contents=docsBodies.join("😃");


 const filledPrompt= buildFullPrompt(query, contents);
  console.log(filledPrompt);

  const answer= await completion(filledPrompt)
  console.log(answer);

  const data = {
    answer,
  };

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/prompt' \
    --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions", "query":"Your query here"}'

*/

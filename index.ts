import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { loadData, getInsights, DataRow } from './calculation';
import path from 'path';
import Text from './model';

const app = express();
app.use(bodyParser.json());


app.get('/getData',async(req:Request,res:Response)=>{
  try{
  const data = await Text.find({});
  res.status(200).json({
    message:"Data fetched successfully",
    data,
  })

  }
  catch(error:any){
    res.status(500).json({
      message:"Internal Server Error",
      error:error.message
    })

  }
  
})

app.post('/query', async (req: Request, res: Response) => {
  const { query } = req.body;

 





  try {
    const data: DataRow[] = await loadData(path.join(__dirname, 'output6.csv'));
    let insights: Record<string, any>;

    
      insights = await getInsights(data, query);

      const newResponse = await Text.create({
        query:query,
        response:insights
      })
    

    res.json({ insights });
  } catch (error:any) {
    console.error('Error generating insights:', error);
    res.status(500).send(error.toString());
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import mongoose from 'mongoose'

const textSchema = new mongoose.Schema({
    query:{
        type:String
    },
    response:{
        type:String
    }
});

const Text = mongoose.model("Text",textSchema);
export default Text;
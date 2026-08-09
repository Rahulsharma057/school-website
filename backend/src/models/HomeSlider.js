const mongoose = require("mongoose");


const homeSliderSchema = new mongoose.Schema(
{

title:{
type:String,
required:true,
trim:true
},


description:{
type:String,
default:""
},


buttonText:{
type:String,
default:""
},


buttonLink:{
type:String,
default:""
},


image:{
url:{
type:String,
required:true
},

public_id:{
type:String,
required:true
}

},


status:{
type:Boolean,
default:true
},


order:{
type:Number,
default:0
}


},

{
timestamps:true
}

);


module.exports =
mongoose.model(
"HomeSlider",
homeSliderSchema
);
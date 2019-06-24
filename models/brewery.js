var mongoose = require("mongoose");
 
var brewerySchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String,
   location: String,
   lat:Number,
   lng:Number,
   createdAt: {type:Date, default: Date.now},
   author:{
      id:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"User"
      },
      username:String
   },
   
   reviews: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Review"
      }
  ],
  rating: {
      type: Number,
      default: 0
  }
});
 
module.exports = mongoose.model("Brewery", brewerySchema);
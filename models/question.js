const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const queSchema = new Schema({
    _id:{
        type:Number,
        require:true
    },
    title:{
        type:String,
        require:true
    },
    snippet:{
        type:String,
        require:true
    },
    link:{
        type:String,
        require:true
    },
    vec:{
        type:Array,
        require:true
    },
    index:{
        type:Array,
        require:true
    },
    value:{
        type:Array,
        require:true
    },
    magnitude:{
        type:Number,
        require:true
    },
    magnitude1:{
        type:Number,
        require:true
    },
    freq:{
        type:Array,
        require:true
    },
    len:{
        type:Number,
        require:true
    }

},{ timestamps:true})

const Question = mongoose.model('Question',queSchema);

module.exports = Question ;
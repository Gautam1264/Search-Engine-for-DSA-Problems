const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const Question= require('./models/question');
const fs = require('fs');
const lr = require('line-reader');
var converter = require('number-to-words');
const SpellChecker = require ('spellchecker') ;
const sw = require('stopword');
const { time } = require('console');
const { title } = require('process');
//const { Z_BUF_ERROR } = require('zlib');
const e = require('express');

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

var Idf = new Array(6413);
var updated = new Array(6413);
var sorted =  new Array(1791);
var ind =  new Array(1791);
var TFIDF_index = new Array(1791);
var TFIDF_value = new Array(1791);
var mag = new Array(1791);
var ind = new Array(1791);
var amag = 0 ;
for( var i=0 ; i<6413 ; i++ ){
    Idf[i] = 0 ;
    updated[i] = 0 ;
}
for( var i=0 ; i<1791 ; i++ ){
    ind[i] = i ;
}
var cnt = 0 ;
var map = {} ;
var arr = [];
var narr = [];
var marr = [];

const PORT = process.env.PORT || 3000 ;


const dbURI = 'mongodb+srv://gautam:gautam@cluster0.lloum.mongodb.net/question_set?retryWrites=true&w=majority';

mongoose.connect(dbURI,{useNewUrlParser:true, useUnifiedTopology: true})
    .then((result)=>{
        //console.log('Connect') ;
        function a1(){
            cnt = 0 ;
            //lr.eachLine('./IDF_values.txt', (line, last) => {
            lr.eachLine('./IDF.txt', (line, last) => {
                Idf[cnt] = Number(line) ;
                cnt += 1 ;
            })
        }
        function a2(){
            cnt = 0 ;
            lr.eachLine('./keywords/ans.txt', (line, last) => {
                map[line] = cnt ;
                cnt += 1 ; 
            })
        }
        function a3(){
            cnt = 0 ;
            Question.find({_id:{$in:ind}})
                .then((result)=>{
                    result.forEach((question)=>{
                        TFIDF_index[cnt] = question.index ;
                        //TFIDF_value[cnt] = question.value ;
                        TFIDF_value[cnt] = question.freq ;
                        //mag[cnt] = question.magnitude ;
                        mag[cnt] = question.len ;
                        //console.log(cnt) ;
                        cnt += 1 
                    })
                    
                })
                .catch((err)=>console.log(err));
        }
        let is_shop_open = true;

        function time(ms) {
            return new Promise((resolve, reject) => {
                if (is_shop_open) {
                    setTimeout(resolve, ms);
                } else {
                    reject(console.log("Shop is closed"));
                }  
            });
        }

        async function start(){
            try{
                await time(3000) ;
                a1() ;
                await time(2000) ;
                a2() ;
                await time(2000) ;
                a3() ;
                await time(10000) ;
                amag = 0 ;
                for( var i=0 ; i<1791 ; i++ ){
                    amag += mag[i]/1791 ; 
                }
                //await time(3000) ;
                console.log(amag);
                app.listen(PORT)
                console.log('Complete') ;
            }catch(error){
                console.log(error) ;
            }
        }
        start() ;
        
    })
    .catch((err)=>console.log(err));


var id1 ;

app.get('/',(req,res)=>{
    res.render('index',{title:'Home Page'});
});


app.get('/search-result',(req,res)=>{

    
    
    Question.find({_id:{$in:arr}})
        .then((result)=>{
            //console.log(result);
            
            result.sort((a,b)=>{
                if( marr.indexOf(a._id)>marr.indexOf(b._id)){
                    return 1 ;
                }else{
                    return -1 ;
                }
            })
            res.render('result',{title:'Result' , questions: result});
        })
        .catch((err)=>console.log(err)); 
});

app.post('/search-result',(req,res)=>{
    while( arr.length>0 ){
        arr.pop() ;
        marr.pop() ;
    }
    //console.log( (Object.keys(map)).length );
    //console.log(req.body.que)
    var old = req.body.que.replaceAll('\n'," "); 
    old = old.replaceAll('[',' ').replaceAll(']',' ').replaceAll(':',' ').replaceAll(',',' ').replaceAll('.',' ').replaceAll('-','').replaceAll('=','').replaceAll('<',' ').replaceAll('+',' ').replaceAll('?',' ').replaceAll('(',' ').replaceAll(')',' ').replaceAll("'",' ').replaceAll('"',' ').replaceAll(';',' ').replaceAll('}',' ').replaceAll('{',' ').replaceAll('!',' ').replaceAll('*',' ').replaceAll('/',' ').replaceAll('>',' ').replaceAll('^',' ').replaceAll('_',' ').replaceAll('#',' ').replaceAll('@',' ').replaceAll('|',' ').replaceAll('%',' ').replaceAll('$',' ').replaceAll('&',' ').replaceAll('\\',' ').replace(/:''\?[,]/g," ").replace(/\s{2,}/g," "); /*.replace(/[0-9]/g, ' ')*/
    var oldString = old.split(' ') ; 
    //console.log(old);
    var newString = sw.removeStopwords(oldString);
    
    var map1 = newString.reduce(function(prev, cur) {
        prev[cur.toLowerCase()] = (prev[cur.toLowerCase()] || 0) + 1;
        return prev;
    }, {});
    delete map1[''];

    var k1 = Object.keys(map1);
    var v = Object.values(map1);
    var k2 = Object.keys(map);
    //console.log(k1) ;
    //console.log(v) ;
    var sum = 0 ;
    for( var j=0 ; j<6413 ; j++ ){
        updated[j] = 0 ;
    }
    for( var j=0 ; j<1791 ; j++ ){
        sorted[j] = 0 ;
    }

    function onlyNumbers(str) {
        return /^[0-9]+$/.test(str);
    }

    // IF NUMBERS ARE PRESENT, THEY ARE CONVERTED TO WORDS.

    for( var j=0 ; j<k1.length ; j++ ){
        if( onlyNumbers(k1[j]) ){
            var temp = converter.toWords(Number(k1[j])).toString() ; 
            k1[j] = temp ;    
        }
    }

    // HANDLED SPELLING MISTAKES  

    var arr1 = [];
    for( var j=0 ; j<k1.length ; j++ ){
        if( SpellChecker.isMisspelled(k1[j]) ){
            var k = SpellChecker.getCorrectionsForMisspelling(k1[j]);
            //console.log(k);
            k.forEach((x)=>{
                if( k2.indexOf(x) !== -1 ){
                    arr1.push([x,j]);
                }
            })
        }
    }
    
    arr1.forEach((y)=>{
        k1.push(y[0]) ;
        v.push(v[y[1]]);
    })
    //console.log(k1);
    //console.log(k1.length);

    for( var j=0 ; j<k1.length ; j++ ){
        if( k2.indexOf(k1[j]) !== -1 ){
            //console.log(k1[j],map[k1[j]],v[j]) ;
            updated[map[k1[j]]] = v[j] ;
            sum += v[j] ;
        }
    }
    //console.log(sum);
    var countn= 0 ; 
    var qmag = 0 ; 
    
    for( var j=0 ; j<6413 ; j++ ){
        if( updated[j] != 0 ){
            //console.log(updated[j],j);
            countn++ ;
        }
    }

    // IMPLEMENTED BM-25 ALGORITHM
    
    for( var l=0 ; l<1791 ; l++ ){
        var s1 = 0 ;
        for( var m=0 ; m<TFIDF_index[l].length ; m++ ){
            if( updated[TFIDF_index[l][m]] !== 0 ){
                
                //console.log(Idf[TFIDF_index[l][m]]);
                //console.log(amag);
                var ans = Idf[TFIDF_index[l][m]]*TFIDF_value[l][m]*2 ;
                //console.log(ans) ;
                var ans1 = 1*(0.2+0.8*(mag[l]/amag)) + TFIDF_value[l][m] ; 
                //console.log(ans1) ;
                ans = ans/ans1 ;
                //console.log(ans) ;
                s1 += ans ;
            }     
        }
        sorted[l] = s1 ;
        //console.log(sorted[l],'  :  ' , l) ;
    }
    for( var i=0 ; i<1791 ; i++ ){
        if( Number.isNaN(sorted[i])){
            sorted[i] = 0 ;
        }
    }
    var c=0 ;
    for( var i=0 ; i<10 ; i++ ){
        var index = sorted.indexOf(Math.max(...sorted));
        //console.log(index,sorted[index]) ;
        if( sorted[index] == 0 ){
            c++ ;
            continue ; 
        }
        sorted[index] = -1 ;
        arr.push(index) ;
        marr.push(index)
    }

    if( c==10 ){
        console.log('Reached') ;
        arr = [] ;
        marr = [] ;
    }
    //marr = arr ;
    narr = arr.sort(function(a, b){return a-b}) ;

    //console.log(arr) ;
    //console.log(marr) ;
    res.redirect('/search-result');

});

app.get('/details/:id',(req,res)=>{
    var id = req.params.id ;
    id++ ;
    var ch1 = '1' ;
    if( id>900 ){
        ch1 = '2' ;
    }
    fs.readFile('./Leetcode'+ch1+'/problem'+(id).toString()+'.txt', (err,data)=>{
        if(err){
            console.log(err);
        }else{
            var old = data.toString().substring(2,data.toString().length-1).replaceAll('\\xc2'," ").replaceAll('\\xa0'," ").split('\\n') ;
            //console.log(old) ;
            
            Question.findById(id-1)
                .then((result)=>{
                    var link = result.link.toString() ;
                    res.render('details',{title:'Details of the question' , det : { "st" : old , "re" : link } });
                })
                .catch((err)=>console.log(err));   
        }
    });
});

app.use((req,res)=>{
    res.status(404).render('404',{title:'404'});
});


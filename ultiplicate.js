$(document).ready(function(){
    var $d = $('.main');
    
    var lang = {
            "pl-PL" : {
                times : " razy ",
                next  : " OK, następne. "
            },
            "en-GB" : {
                times : " times ",
                next  : " OK, next one. "
            },
            "es-ES" : {
                times : " por ",
                next  : " OK, siguiente. "
            }
        },
        locale = getLang(),
        quest,
        resp = "?",
        timer,
        respTime = 15,
        results = [],
        matrix = [],
        weights = [],
        rowStatus = [];

    for(var i = 1; i <= 10; i++){ rowStatus[i] = true; }
    $('input').keydown(handleKeyDown).keyup(handleKeyUp);
    drawNewQuest();
    calculateMatrix();
    calculateWeights();
    renderBoard();


    function getQuest(){
        var ab = weightedRandom();
        return {            
            a : ab.a,
            b : ab.b,
            time : respTime,
            timeLeft : 0,
            timeStep : 0.1
        }
    }

    function calculateWeights(){
        weights = [];
        for(var y=2; y<=10; y++){
            
            if(!rowStatus[y]) continue;

            for(var x=2; x<=10; x++){
                weights.push({
                    b: y,
                    a: x,
                    w: matrix[y][x]
                })
            }
        }
        weights.sort(function(m,n){
            if(m.w < n.w) return -1;
            if(m.w > n.w) return 1;
            return 0;
        });
    }
    function weightedRandom(){
        var scope = Math.max( weights.length * 0.05, 2);
        return weights[Math.ceil(Math.random()*scope)];
    }
    function random(){
        return Math.floor(Math.random() * 9 + 2);
    }
    function decreaseTime(q){
        q.timeLeft = q.timeLeft - q.timeStep;
    }
    function timeLeftPercent(q){
        return 100 * q.timeLeft / q.time;
    }
    function renderQuestion(q){
        $('.qbody .a').html(q.a);
        $('.qbody .b').html(q.b);
    }
    function startTimer(q){
        q.timeLeft = q.time;
        if(timer) clearInterval(timer);
        timer = setInterval(function(){
            decreaseTime(q);
            //console.log(timeLeftPercent(q));
            $('.progress').width(timeLeftPercent(q) + '%');
            if(q.timeLeft <= 0){
                markTimeout(q);
            }
        }, 1000 * q.timeStep); 
    }

    function renderBoard(){
        var t = $('table.board').empty();
        for(var y=1; y<=10; y++){
            var row = $('<tr>')
                .on("click", toggleRow)
                .addClass(rowStatus[y] ? "" : "out");
            for(var x=1; x<=10; x++){
                var isHeader = (x === 1 || y === 1),
                    cell = isHeader ? $('<th>') : $('<td>'),
                    value = isHeader ? x * y : "";
                cell.html(value).css('opacity', matrix[y][x]);
                row.append(cell);
            }
            t.append(row);
        }
        return t;
    }

    function toggleRow(){
        var rowIndex = $(this).index() + 1;
        rowStatus[rowIndex] = !rowStatus[rowIndex];
        
        if(rowStatus[rowIndex]) {
            $(this).removeClass('out');
        } else {
            $(this).addClass('out');
        }
    }

    function calculateMatrix(){
        var m = [];
        
        for(var y=1; y<=10; y++){
            m[y] = [];
            for(var x=1; x<=10; x++){
                m[y][x] = (x===1 || y===1) ? [0.7] : [0.05];
            }
        }
        results.forEach(function(v){
            m[v.b][v.a].push(v.timeLeft / v.time);
        });
        for(var y=1; y<=10; y++){
            for(var x=1; x<=10; x++){
                var scores = m[y][x];
                m[y][x] = average(scores);
            }
        }
        matrix = m;
    }

    function average(arr){
        return arr.reduce(function(a,b){ return a+b; }) / arr.length;
    }

    function highlight(){
        var row = $(this).parent(),
            allRows = row.parent().children(),
            allCells = allRows.children(),
            colIndex = $(this).index();
            column = allCells.filter(function(){
                return $(this).index() === colIndex;
            });
        allRows.removeClass('highlight');
        allCells.removeClass('highlight');
        row.addClass('highlight');
        column.addClass('highlight');
    }

    function handleKeyDown(e){
        var char = String.fromCharCode(e.which);
        if(e.which !== 8 && isNaN(parseInt(char))) e.preventDefault();
    }
    function handleKeyUp(e){
        var res = parseInt($(this).val());
        clearOK();
        if(!isNaN(res) && isCorrectResponse(res)){
            markOK();
        }
    }
    function markTimeout(){
        say(" " + (quest.a * quest.b) + lang[locale].next,);
        clearInterval(timer);
        storeResult(false);
        calculateMatrix();
        calculateWeights();
        renderBoard();
        drawNewQuest();
    }
    function markOK(){
        $('.question').addClass('OK');
        say((quest.a * quest.b));
        clearInterval(timer);
        storeResult(true);
        calculateMatrix();
        calculateWeights();
        renderBoard();
        drawNewQuest();        
    }
    function clearOK(){
        $('.question').removeClass('OK');
    }
    function isCorrectResponse(res){
        return res === quest.a * quest.b;
    }
    function storeResult(isOK){
        quest.isOK = isOK;
        quest.resp = resp;
        results.push(quest);
    }
    function drawNewQuest(){
        renderResults();
        var countDown = 40,
            drawTimer = setInterval(function(){
                $('.test').html(countDown);
                quest = getQuest();
                renderQuestion(quest);
                countDown--;
                if(countDown < 0) {
                    clearInterval(drawTimer);
                    startTimer(quest);
                    clearOK();
                    $("input").val("").focus();
                    say(quest.a + lang[locale].times + quest.b +"?");
                }
            }, 50);
        
    }

    function renderResults(){
        if(!weights || weights.length === 0) return;
        var $r = $(".results .bg"),
            avg = weights.reduce( function(a, b){ 
                return (a.w || a) + b.w; 
            } ) / weights.length;
        $r.width((100 * avg)+"%");
        $(".results .label").html((100 * avg).toFixed(2));
        //$r.html(Math.floor(avg * 100));
        //weights.forEach(function(v){
        //    $r.prepend("<span>"+v.a+" x "+v.b+": " + v.w.toFixed(2) + "</span>");
        //})
    }

    function say(text){
        var msg = new SpeechSynthesisUtterance();    
        //msg.voice = window.speechSynthesis.getVoices()[1];
        msg.lang = getLang();
        msg.rate = 1;
        msg.pitch = 1;    
        msg.text = text;

        speechSynthesis.speak(msg);
    }

    function getLang(){
        if (navigator.languages != undefined) 
        return navigator.languages[0]; 
        else return navigator.language;
    }
});
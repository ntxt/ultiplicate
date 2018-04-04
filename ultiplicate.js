$(document).ready(function(){
    var $d = $('.main');
    //$d.append('<div>test</div>');
    var quest,
        resp = "?",
        timer,
        results = [],
        matrix = [],
        weights = [];

    $('input').keydown(handleKeyDown).keyup(handleKeyUp);
    drawNewQuest();
    calculateMatrix();
    renderBoard();


    function getQuest(){
        var ab = weightedRandom();
        return {            
            a : ab.a,
            b : ab.b,
            time : 10,
            timeLeft : 0,
            timeStep : 0.1
        }
    }
    function weightedRandom(){
        weights = [];
        for(var y=2; y<=10; y++){
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
        })
        var scope = weights.length * 0.05;

        return weights[Math.floor(Math.random()*scope)];
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
            var row = $('<tr>');
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

    function calculateMatrix(){
        var m = [];;
        
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
                m[y][x] = scores.reduce(function(a,b){ return a+b; }) / scores.length;
            }
        }
        matrix = m;
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
        clearInterval(timer);
        storeResult(false);
        calculateMatrix();
        renderBoard();
        drawNewQuest();
    }
    function markOK(){
        $('.question').addClass('OK');
        clearInterval(timer);
        storeResult(true);
        calculateMatrix();
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
        //renderHistory();
        renderWeights();
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
                }
            }, 50);
    }
    function renderHistory(){
        var $r = $(".results").empty();
        results.forEach(function(v){
            $r.prepend("<span class='"+(v.isOK ? "OK" : "wrong")+"'>"+v.a+" x "+v.b+"</span>");
        })
    }
    function renderWeights(){
        var $r = $(".results").empty();
        weights.forEach(function(v){
            $r.prepend("<span>"+v.a+" x "+v.b+": " + v.w.toFixed(2) + "</span>");
        })
    }
});
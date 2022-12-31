var EMPTY = 'rgb(227, 227, 227)', NORMAL = 'rgb(32, 123, 255)', ERROR = 'rgb(252, 78, 78)',
    DISABLED = 'rgb(110, 110, 110)', ENABLED_NUMBER = 'rgb(255, 164, 32)', SELECTED_NUMBER = 'rgb(182, 226, 161)',
    ENABLED_HELPER = 'rgb(135, 18, 91)', SELECTED_HELPER = 'rgb(120, 175, 255)',
    H_EMPTY = 'rgb(208, 196, 232)', H_AREA = 'rgb(125, 78, 252)', H_CELL = 'rgb(0, 232, 242)',
    H_OCC = 'rgb(123, 73, 166)',

    board_solved, board_unsolved,
    insertable = [], empty = [], undoArr = [],
    numberSelected = null,
    numberUsageArr = [0, 0, 0, 0, 0, 0, 0, 0, 0],
    eraseMode = false, notesMode = false, isOn = true,
    mistakesMade = 0, mistakeCount = 0, hintCount,
    timerInterval, settings = {
        'Timer': true,
        'Mistake Limit': true,
        'Mistakes Checker': true,
        'Hide Numbers': true,
        'Highlight Duplicates': true,
        'Highlight Area': true,
        'Highlight Identical': true,
    }, time = 0;


// this basically runs everything , why was it separated from body.onload = ?  
BodyLoad();

function SetIds() {
    var i = 0, j = 0;
    for (let row of document.getElementsByTagName('tr')) {
        for (let col of row.getElementsByTagName('td')) {
            for (let cell of col.getElementsByTagName('button')) {
                if (cell.nodeType === Node.ELEMENT_NODE) {
                    cell.id = `c${i}${j}`;
                    j++;
                }
            }
        }
        i++;
        j = 0;
    }
}

function SetCellOnClick() {
    for (var btn of document.getElementsByClassName('num_block')) {
        btn.onclick = CellClick;
    }
}

function SetSudoku() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board_unsolved[i][j] === 0) {
                document.getElementById(`c${i}${j}`).style.backgroundColor = EMPTY;
            } else {
                var tmp = document.getElementById(`c${i}${j}`);
                tmp.innerText = board_unsolved[i][j];
                tmp.style.fontStyle = 'Italic';
            }
        }
    }
}

function BuildBoard(diff) {
    var game = Play(diff);
    board_solved = game[0];
    board_unsolved = game[1];
}

function BodyLoad() {
    var url = new URL(window.location.href);
    // the diffuctly was sent using the url -- not the cookies
    var diff = url.searchParams.get("diff");

    SetIds();
    SetCellOnClick();
    BuildBoard(diff);
    SetSudoku();

    SetNumbersOnClick();
    SetHelpersOnClick();

    RetrieveSettings();

    StartTimer();
    SetPLayPauseClick();
    SetHintAndMistakes(diff);

    SetEmptyAndInsertable();
    console.log(board_solved);
}

function HighlightBox(r, c) {
    r = Math.floor(r / 3) * 3;
    c = Math.floor(c / 3) * 3;

    for (let i = r; i < r + 3; i++) {
        for (let j = c; j < c + 3; j++) {
            var cell = document.getElementById(`c${i}${j}`);
            if (cell.style.backgroundColor !== ERROR) {
                if (board_unsolved[i][j] === 0)
                    cell.style.backgroundColor = H_EMPTY;
                else
                    cell.style.backgroundColor = H_AREA;
            }
        }
    }
}

function HighlightRowCol(r, c) {
    for (let i = 0; i < 9; i++) {
        var cell_r = document.getElementById(`c${r}${i}`),
            cell_c = document.getElementById(`c${i}${c}`);

        if (board_unsolved[r][i] === 0)
            cell_r.style.backgroundColor = H_EMPTY;
        else
            cell_r.style.backgroundColor = H_AREA;

        if (board_unsolved[i][c] === 0)
            cell_c.style.backgroundColor = H_EMPTY;
        else
            cell_c.style.backgroundColor = H_AREA;
    }
}

function HighlightNumber(n) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            var cell = document.getElementById(`c${i}${j}`);

            if (board_unsolved[i][j] === n)
                cell.style.backgroundColor = H_OCC;
        }
    }
}

function ResetHighlight() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            var cell = document.getElementById(`c${i}${j}`);

            if (board_unsolved[i][j] === 0)
                cell.style.backgroundColor = EMPTY;
            else
                cell.style.backgroundColor = NORMAL;
        }
    }
}

function Highlight(r, c) {
    var n = board_unsolved[r][c];


    ResetHighlight();
    if (settings['Highlight Area']) {
        HighlightBox(r, c);
        HighlightRowCol(r, c);
    }

    if (settings['Highlight Identical'] && n !== 0) HighlightNumber(n);

    if (settings['Highlight Duplicates']) HighlightRuleError();
    if (settings['Mistakes Checker']) HighlightSolutionError(r, c);

    document.getElementById(`c${r}${c}`).style.backgroundColor = H_CELL;
}

function HighlightSolutionError() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board_unsolved[i][j] !== 0 && board_unsolved[i][j] !== board_solved[i][j])
                document.getElementById(`c${i}${j}`).style.backgroundColor = ERROR;
        }
    }
}

function HighlightRuleError() {

    // ROWS & COLS
    var all_occ_r = [], all_occ_c = [];
    for (let i = 0; i < 9; i++) {
        var occ1 = {}, occ2 = {};
        for (let j = 0; j < 9; j++) {
            let tmp = board_unsolved[i][j];

            if (tmp !== 0)
                occ1[tmp] = occ1[tmp] === undefined ? 1 : occ1[tmp] + 1;

            tmp = board_unsolved[j][i];
            if (tmp !== 0)
                occ2[tmp] = occ2[tmp] === undefined ? 1 : occ2[tmp] + 1;
        }
        all_occ_r.push(occ1);
        all_occ_c.push(occ2);
    }
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let tmp = board_unsolved[i][j];
            if (tmp !== 0 && all_occ_r[i][tmp] > 1) {
                document.getElementById(`c${i}${j}`).style.backgroundColor = ERROR;
            }

            tmp = board_unsolved[j][i];
            if (tmp !== 0 && all_occ_c[i][tmp] > 1) {
                document.getElementById(`c${j}${i}`).style.backgroundColor = ERROR;
            }
        }
    }

    // BOX
    var r = 0, c = 0;
    var all_occ = []
    for (let i = 0; i < 9; i++) {
        var occ = {};
        for (let j = r; j < r + 3; j++) {
            for (let k = c; k < c + 3; k++) {
                let tmp = board_unsolved[j][k];
                if (tmp !== 0)
                    occ[tmp] = occ[tmp] === undefined ? 1 : occ[tmp] + 1;
            }
        }
        c += 3;
        if (c === 9) {
            c = 0;
            r += 3;
        }
        all_occ.push(occ);
    }

    r = 0;
    c = 0;
    for (let i = 0; i < 9; i++) {
        for (let j = r; j < r + 3; j++) {
            for (let k = c; k < c + 3; k++) {
                let tmp = board_unsolved[j][k];
                if (tmp !== 0 && all_occ[i][tmp] > 1) {
                    document.getElementById(`c${j}${k}`).style.backgroundColor = ERROR;
                }
            }
        }
        c += 3;
        if (c === 9) {
            c = 0;
            r += 3;
        }
    }
}

// here we choose our path when a cell is clicked
function CellClick(evt) {
    var r = parseInt(evt.target.id[1]), c = parseInt(evt.target.id[2]);

    /* based on what is set to true, we go to it's function. */
    if (eraseMode) {
        Erase(r, c);
        document.getElementById('eraser').click();
        // we only go into the write function if we have a selected number. 
    } else if (numberSelected)
        Write(r, c);


    Highlight(r, c);

}

function Erase(r, c) {
    //if the element in board_unsolved is not 0, then there will be a value to be deleted. 
    // board_unsolved holds the given numbers and the insertables, as khaled needed
    //board_unsolved to hold all of these values for his highlight function. 
    if (board_unsolved[r][c] !== 0) {

        /* But !! we have to check if the cell is given or if have inserted it
            if the indexOf() returns postive number or 0  ==> I have inserted this value. 
            if indexOf() returns  -1  ===> then this cell has not been inserted ... it's given !! 
            and we won't erase anything !! 
         */
        if (insertable.indexOf(`${r}${c}`) !== -1) {

            /* we are here beacause we can erase the number. 
            so we pass the number value to numberUsageTracker to decresee it's count 
            as by erasing it, it becomes available to be added again. 
             */
            NumberUsageTracker('remove', board_unsolved[r][c]);

            undoArr.push(`${0}${board_unsolved[r][c]}${r}${c}`);
            /* we set the board_unsolved to zero 
            and change the inner text to display that this is empty */
            board_unsolved[r][c] = 0;
            document.getElementById(`c${r}${c}`).innerText = "";

            

            /* we only add the indecies to empty again, so we would be able to use it
                both board_unsolved and insertable hold the opposite cells 
                
                for the case of hint where the values is considered given 
            
            then we insert them into board_unsolved and remove them from insertable and empty
            and they are no longer a choice for them.     
            */
            empty.push(`${r}${c}`);
        }
    }
}

function Hint() {

    // if there is no empty cells, then there is no place to insert a hint. 
    if (empty.length === 0) return;

    var rnd = Math.random();

    // this gives a random index in the range of indecies the empty array is capable of . 
    var index = Math.floor(empty.length * rnd);

    /* we are only accessing each element as if it was an array of char
        each element is 'ic' so [0][0] is row  [0][1] is column 
        and here we are doing it for a random index.  */

    //IMPORTANT !!! 

    // we are already basing our random selected cell from the available ones in the empty array !!!!
    // That's why we were sure we don't have any conflict !!!! 
    var row = empty[index][0], col = empty[index][1];

    // we took the correct solution for this cell using the solved board. 
    var value = board_solved[row][col];

    // this if statement is important before anytime we write
    //to get the number disabled when it reaches 9
    // this is an extra help for the player to keep track of his remaining options. 
    if (settings['Hide Numbers']) NumberUsageTracker('add', value);


    board_unsolved[row][col] = value;

    var elem = document.getElementById(`c${row}${col}`);
    elem.innerText = value;
    elem.style.backgroundColor = NORMAL;

    empty.splice(index, 1);
    insertable.splice(insertable.indexOf(`${row}${col}`), 1);

    Highlight(row, col, true, true);
}



/* NOTE: 
 insertable ====> is important for the write function to make sure that we can write at that location 
                    any addition to a given like "hint" ...... we remove that lcoation from insertable. 

empty ===> empty needs to be updated as we insert, as it's used in the "hint" function
            and the hint needs to keep track of all the empty space to base it's random range on it
            to not get the indecies of a cell that already have something written in it. 
                    */
                 

function Write(r, c) {

    // 1- if the cell not available for insert, go back. 
    if (insertable.indexOf(`${r}${c}`) === -1) return;

    var selectedCell = document.getElementById(`c${r}${c}`);

    if (notesMode) {
        // 2- in notes mode we are just writing on the html without any effect on our game. 
        selectedCell.innerText = numberSelected;
    } else {
        // 3- if there was a value stored in that cell, we store it in prev before overWriting it. 
        var prev = board_unsolved[r][c];
        
        // 4- the undoArr takes    currentValue-PreviouslyStoredValuInCell -the row and column we are talking about. 
        undoArr.push(`${numberSelected}${board_unsolved[r][c]}${r}${c}`);

        selectedCell.innerText = numberSelected;
        board_unsolved[r][c] = numberSelected;

        // 5- We remove the element from the empty arr if it was found in it. 
        var idx = empty.indexOf(`${r}${c}`);
        if (idx !== -1)
            // splice takes the index and the number of elements to remove from that starting element
            // writing (1) only removes the element at the index we sent. 
            empty.splice(idx, 1);

        // 6- we keep repeating this part before calling the NumberUsageTracker()
        // to respect our choosen settings. 
        if (settings['Hide Numbers']) {
            NumberUsageTracker('add', numberSelected);
            //if our cell currently holds a number, we send the previous number to the tracker
            // to decrease it. 
            // note that: that previous number might be 0. 
            if (board_unsolved[r][c] !== 0) {
                NumberUsageTracker('remove', prev);
            }
        }

        // 7- if we are counting mistakes and the inserted value doesn't match the one in board_solved.
        if (settings['Mistake Limit'] && board_unsolved[r][c] !== board_solved[r][c]) {
            // we increase mistakes and display the new values
            mistakesMade++;
            $('#mistakes').text(`Mistakes: ${mistakesMade}/${mistakeCount}`);

            // with each mistake we call this function to check if we lost. 
            // based on the difficulty we sat at the begaining. 
            CheckLose();
        }

        // if we don't have any empty spots in the board, we check if we won or not. 
        if (empty.length === 0) CheckWin();
    }

}

function Undo() {

    if (undoArr.length !== 0) {

        /* this undo instead of registering the operation
            it stores the previous 
            new and previously numbers 
            
            in case of reversing an insert... then if old was 0 ===> we clear the cell
                    if it was another number, we write that new number. 
                    
            it works the same for reversing an erase: 
            
            the new number in erasing was 0 and old was the written number in the cell if it's (0) or a number. 
            
            we do the same without changing any of the logic and set cell to the old value*/

        var history = undoArr.pop();

        var _new = parseInt(history[0]);
        var _old = parseInt(history[1]);
        var r = parseInt(history[2]);
        var c = parseInt(history[3]);

        var selectedCell = document.getElementById(`c${r}${c}`);

            // we add the old number back and remove the new number 
        NumberUsageTracker('remove', _new);
        NumberUsageTracker('add', _old);

        // this line is really important for the maintenece of the code 
        //in reversing insertation and deletion. 
        selectedCell.innerText = _old === 0 ? '' : _old;
        board_unsolved[r][c] = _old;

        // we call highlight when we do something on the board where 
        // we didn't press any of the cells 

        // as pressing one of the cells would have called highlight automatically. 
        Highlight(r, c);
    }
}

function NumberUsageTracker(operation, targetNumber) {
    if (targetNumber <= 0) return;

    // this part about tracking the counter array. 
    if (operation === 'add') numberUsageArr[targetNumber - 1]++;
    else if (operation === 'remove') numberUsageArr[targetNumber - 1]--;
    else return;

    // here we focus on disabling the button when reaching 9 
    // note that all the number buttons id are n1 n2 n3 and so on. 
    var tmp = document.getElementById(`n${targetNumber}`);

    if (numberUsageArr[targetNumber - 1] === 9) {
        //physically disabled. 
        tmp.disabled = true;
        //visually disabled.
        tmp.style.backgroundColor = DISABLED;
        // removed logically from the selection
        // as if it was never selected.
        numberSelected = null;
    } else {
        if (tmp.disabled === null || tmp.disabled === true) {

            /* we added the if to make sure that tmp.disabled reads the element and not null
                if we enter here this means the number count is not 9 
                so we enable it again. 
             */
            tmp.disabled = false;
            tmp.style.backgroundColor = ENABLED_NUMBER;
        }
    }

}


// this add an eventListener to each number button in the controlPanel. 
function SetNumbersOnClick() {
    for (var elem of document.getElementsByClassName('numControl')) {
        elem.addEventListener("click", NumberClicked);
    }
}

function NumberClicked(evt) {

    // this extractsd the value of the number selected from it's id 
    // for ex:  5 
    var _newSelected = parseInt(evt.target.id[1]);

    // if you are pressing the same button again, which was previously stored in numberSelected. 
    if (numberSelected === _newSelected) {
        // then we set it's color to normal color which is "enabled", because we have the disabled color 
        // when the number reaches it's max count. 
        document.getElementById(`n${numberSelected}`).style.backgroundColor = ENABLED_NUMBER;
        // we also set numberSelected back to null as nothing will is selected now 
        numberSelected = null;
    } else {
        // this if checks if you had already selected anything and deselect it. 
        // if numberSelected === null then this is your first selection and you go straight to 
        // the next lines. 
        if (numberSelected !== null)
            document.getElementById(`n${numberSelected}`).style.backgroundColor = ENABLED_NUMBER;
        
        // then we assign a the new ==> numberSelected to the variable and we change it's color. 
        document.getElementById(`n${_newSelected}`).style.backgroundColor = SELECTED_NUMBER;
        numberSelected = _newSelected;
    }

}


// this adds an eventListener to each button in the controlPanel. 
function SetHelpersOnClick() {
    // $("#undo").click(function () { Undo(); });

    // on is like eventListeners
    $("#undo").on('click', function () {
        Undo();
    });

    $("#hint").on('click', function () {
        if (hintCount > 0) {
            hintCount--;
            Hint();
        } else {
            var tmp = document.getElementById('hint');
            tmp.disabled = true;
            tmp.style.backgroundColor = DISABLED;
        }
    })

    $("#notes").on('click', function () {
        notesMode = !notesMode;

        var _notes = document.getElementById('notes');
        if (notesMode)
            _notes.style.backgroundColor = SELECTED_HELPER;
        else
            _notes.style.backgroundColor = ENABLED_HELPER;
    });

    $("#eraser").on('click', function () {
        eraseMode = !eraseMode;

        var _eraser = document.getElementById('eraser');
        if (eraseMode)
            _eraser.style.backgroundColor = SELECTED_HELPER;
        else
            _eraser.style.backgroundColor = ENABLED_HELPER;

    })
}

function CheckWin() {
    var won = true;

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board_unsolved[i][j] !== board_solved[i][j]) {
                // this will break out of the function if a cell doesn't match the final solution.
                won = false;
                break;
            }
        }
    }

    // if we bypassed the first check, this means we won.. congratz.
    if (won) {
        $('#end_img').attr('src', '../assets/game/win.png');
        $('#end').css('display', 'block');

        setTimeout(function () {
            //this line uses the history object to get us back to previous page after 5 seconds
            // which was the main menu. 
            history.back();
        }, 5000);
    }
}

function CheckLose() {
    // if it's a match, then you lost, display the losing img and get you back to 
    // the main menu, the same structure of when you won. 
    if (mistakeCount === mistakesMade) {
        $('#end_img').attr('src', '../assets/game/gameover.png');
        $('#end').css('display', 'block');
        setTimeout(function () {
            history.back();
        }, 5000);
    }
}

// here we retrieve the data we store in the cookies using the settings.js
function RetrieveSettings() {
    // allcookieList() retrieves an array that contains all the created cookies.
    // you can access the value of any of them using ascotive array. 
    var tmp = allCookieList();
    for (var settingsKey in settings) {
        var crnt = tmp[settingsKey];
        // this loop will run throw the settings object
        // and assign true or false to each setting based on the retrived info from the cookie. 
        // it gets called everytime you refresh the page. 
        if (crnt === undefined || crnt === 'on')
            settings[settingsKey] = true;
        else if (crnt === 'off')
            settings[settingsKey] = false;
    }
}

function StartTimer() {
    // if the timer settings came with 'true'
    // we start excuting the function. 
    if (settings['Timer']) {
        timerInterval = setInterval(function () {
            time += 1;

            var seconds = (time % 60).toString();
            var minutes = (Math.floor(time / 60)).toString();

            if (seconds.length === 1) seconds = `0${seconds}`;
            if (minutes.length === 1) minutes = `0${minutes}`;

            // this will print it out in it's div
            $('#playTime').text(`${minutes}:${seconds}`);

        }, 1000);
    } else {
        // if the timer is 'false' 
        // we hide it's visibility. 
        $('#timerDiv').css('visibility', 'hidden');
    }
}

function SetPLayPauseClick() {

    /* the time must be 'true' for the playback settings to be needed. */
    if (settings['Timer']) {
        $('#pause_btn').on('click', function () {
            if (isOn) {
                clearInterval(timerInterval);
                /* Important !!! 
                        this goes to the id = board, which is the table holding the board
                        then to the buttons that are inside of it and disabling them  or enabling them 
                    based on what is pressed.
                    this will make the board buttons un clickable, which will hold the who game as alot of functions 
                    depend on the cells being clicked ! 
                */    
                $('#board button').each(function (i, obj) {
                    obj.disabled = true;
                });

                isOn = false;
            }
        });

        $('#play_btn').on('click', function () {
            if (!isOn) {
                StartTimer();

                $('#board button').each(function (i, obj) {
                    obj.disabled = false;
                });

                isOn = true;
            }
        });
    } else {
        $('#play_btn, #pause_btn').css('visibility', 'hidden');
    }
}

function SetHintAndMistakes(diff) {
    /* this sets the hint and mistake variables based on difficulity. */
    if (diff === 'e') {
        hintCount = 5;
        mistakeCount = 10;
    } else if (diff === 'm') {
        hintCount = 4;
        mistakeCount = 7;
    } else {
        hintCount = 3;
        mistakeCount = 5;
    }

    /* if mistake limit is true, then we print out the count on the screen 
        this is only the intialization, we have "Mistake made" variable 
        which gets updated and inserted in the write() function. 
    */
    if (settings['Mistake Limit'])
        $('#mistakes').text(`Mistakes: 0/${mistakeCount}`);
}

function SetEmptyAndInsertable() {

    /* this function intilize both insertable and empy ( both are 1-D arrays) 
        we push all the locations that contains 0 from the unsolved board,
        into empty and insertable.
        so we if use a cell ---- we insert it in insertable 
        and remove it from the empty array

        the arrays store a string elements which hold the row and column of the cell
        which can be accessed later easily using indexof()
        if the element exists ===> indexof() will return it's index in the 1-D array. 
        if it's not there ===> indexOf() will return -1 

        --- We also se the intial value for each element in the numberUsageArr
        
        if the element in the board_unsolved has a value 
        then we increase it's counter in the array by 1 

        so basically this function does 3 things at the same time,
        pretty smart move I would say 😁
        */
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let tmp = board_unsolved[i][j];

            if (tmp === 0) {
                insertable.push(`${i}${j}`);
                empty.push(`${i}${j}`);
            } 
            else 
            numberUsageArr[tmp - 1]++;
        }
    }
}



/* Notes summary 


suduko project raouf summary 
————————————————

1- button toggles 
——————
1 —— clicking the same number again removes selection 
2 —— clicking another number will first remove the selection from current
            and move it to our new number 

2- write() 
————————-
we mainly consider (insertable arr) as reference , but we maintain (empty arr) for the hint() fn. 
1—— if we the cell is part of instable we go in.
               because this means it's not part of board_unsolved ====> which includes the untouchable gives and the hint() fn results. 
2—— if notes mode is on, then the write is only visually and nothing is stored or calculated 
3-——  we call the usageTracker and undoArr for later use
4—- we remove that cell from (emptyArr) 

            * so we made sure that we can only write in empty places 
                and we can overwrite the number we wrote even.*
the cell is only returned to (emptyArr) when using erase or undo. 

3- undo 
——————-
it takes  (newNumber,oldNumber,r,c)
this make it a general case no matter what the pervious operation was 
deletion or insertion. 

4- usageTracker
———————
— was updated in table creation by how many entries are available for each number.
— then we keep updating it through out our whole code. 

if !! it's option is left on,,, as it's considered an extra help for the player 

if we reached 9  .. then ===>
                                        a) we disable the button to be unclickable 
                                        b) change it's color 
                                        c) remove it from selection by putting  —-> numberSelected = null 
                                    
*/
var edit = (function(){
    "use strict";

    var z = zera;

    // Editing API
    //
    // Nil  - make a nil Node
    // Cons - make a cons Node
    // New  - make new board
    // Show - Render board
    // Eval - Evaluate board
    
    function Board(name) {
        this.name  = name;
        this.index = {};
        this.forms = [];
    }

    Board.prototype.render = function() {
        var buffer = [];
        for (var i = 0; i < this.forms.length; i++) {
            var id = this.forms[i];
            buffer.push(render(this.index[id], id));
        }
        document.getElementById('main').innerHTML = buffer.join('');
    };

    var ID = 0;
    function id() {
        return ID++;
    }

    Board.prototype.addForm = function(form) {
        var fid = id();
        this.index[fid] = form;
        this.forms.push(fid);
    };

    Board.prototype.setForm = function(fid, form) {
        this.index[fid] = form;
    };

    function board(name) {
        return new Board(name);
    }

    function renderBoolean(form, id) {
        return ['<div class="form boolean" id="', id, '">', form === true ? "true" : "false", '</div>'].join('');
    }

    function renderNumber(form, id) {
        return ['<div class="form number" id="', id, '">', form, '</div>'].join('');
    }

    function renderNil(form, id) {
        return ['<div class="form nil" id="', id, '">()</div>'].join('');
    }

    function render(form, id) {
        if (z.isBoolean(form)) {
            return renderBoolean(form, id);
        }
        else if (z.isNumber(form)) {
            return renderNumber(form, id);
        }
        else if (z.isNil(form)) {
            return renderNil(form, id);
        }
        else if (z.isCons(form)) {
            if (z.isPair(form)) {
                return renderPair(form, id);
            }
            var tag = z.car(form);
        }
        else {
            console.log(form);
            throw new Error('invalid form');
        }
    }

    return {
        board: board
    };
}());

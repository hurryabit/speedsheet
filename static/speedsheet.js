"use strict";
var logArea;
var formulaInput;
var formulaFieldSet;
var formulaForm;
var selectedCell;
var Key;
(function (Key) {
    Key[Key["ENTER"] = 13] = "ENTER";
    Key[Key["ESCAPE"] = 27] = "ESCAPE";
    Key[Key["LEFT"] = 37] = "LEFT";
    Key[Key["UP"] = 38] = "UP";
    Key[Key["RIGHT"] = 39] = "RIGHT";
    Key[Key["DOWN"] = 40] = "DOWN";
})(Key || (Key = {}));
// Handler for clicking on cells.
function onSelectCell(event) {
    var previousCell = selectedCell;
    selectedCell = event.target;
    previousCell.classList.remove("table-primary");
    selectedCell.classList.add("table-primary");
    selectedCell.focus();
    formulaInput.value = selectedCell.dataset.formula;
    formulaFieldSet.disabled = true;
}
function onEditCell(event) {
    onSelectCell(event);
    formulaFieldSet.disabled = false;
    formulaInput.focus();
    formulaInput.select();
}
function onKeypressCell(event) {
    if (event.which === Key.ENTER) {
        $(event.target).dblclick();
    }
}
function onKeydownCell(event) {
    var oldCoord = event.target.id;
    var newCoord;
    switch (event.which) {
        case Key.LEFT: {
            newCoord = String.fromCharCode(oldCoord.charCodeAt(0) - 1) + oldCoord.substring(1);
            break;
        }
        case Key.UP: {
            var row = parseInt(oldCoord.substring(1), 10);
            newCoord = oldCoord.charAt(0) + (row - 1).toString();
            break;
        }
        case Key.RIGHT: {
            newCoord = String.fromCharCode(oldCoord.charCodeAt(0) + 1) + oldCoord.substring(1);
            break;
        }
        case Key.DOWN: {
            var row = parseInt(oldCoord.substring(1), 10);
            newCoord = oldCoord.charAt(0) + (row + 1).toString();
            break;
        }
        default:
            return;
    }
    $("#" + newCoord).click();
}
function log(msg) {
    logArea.value += "\n" + msg;
    logArea.scrollTop = logArea.scrollHeight;
}
function clearLog() {
    logArea.value = "Computation log:";
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
}
else {
    initialize();
}
function initialize() {
    var sheetTable = document.querySelector("#sheet");
    selectedCell = document.querySelector("#A1");
    logArea = document.querySelector("#log");
    var clearButton = document.querySelector("#clear");
    formulaInput = document.querySelector("#formula");
    formulaFieldSet = document.querySelector("#formula_fieldset");
    formulaForm = document.querySelector("#formula_form");
    // Set up log widget.
    $(logArea).outerHeight($(sheetTable).outerHeight());
    clearLog();
    clearButton.addEventListener("click", function () { return clearLog(); });
    // Install handler for clicking on table cells.
    $("td").each(function (_, cell) {
        $(cell).prop("tabindex", -1);
        $(cell).on("click", onSelectCell);
        $(cell).on("dblclick", onEditCell);
        $(cell).on("keypress", onKeypressCell);
        $(cell).on("keydown", onKeydownCell);
    });
    formulaInput.addEventListener("keydown", function (event) {
        if (event.which === Key.ESCAPE) {
            event.preventDefault();
            selectedCell.click();
        }
    });
    selectedCell.click();
    formulaForm.addEventListener("submit", function (event) {
        event.preventDefault();
        $.ajax({
            data: {
                coord: selectedCell.id,
                formula: formulaInput.value
            },
            dataType: "json",
            method: "post",
            url: "update"
        })
            .done(function (data) {
            switch (data.kind) {
                case "Ok": {
                    log("> " + selectedCell.id + " = " + formulaInput.value);
                    for (var _i = 0, _a = data.ok; _i < _a.length; _i++) {
                        var entry = _a[_i];
                        // TODO: Raise an error if the cell does not exist.
                        document.querySelector("#" + entry.coord).textContent = entry.to.toString();
                        log(entry.coord + " = " + entry.to);
                    }
                    selectedCell.dataset.formula = formulaInput.value;
                    selectedCell.click();
                    break;
                }
                case "Err": {
                    alert(data.err);
                    break;
                }
                default: impossible(data);
            }
        })
            .fail(function (xhr, status, error) { alert("Connection to server failed: " + error); });
    });
}
var Ok = /** @class */ (function () {
    function Ok(ok) {
        this.kind = "Ok";
        this.ok = ok;
    }
    return Ok;
}());
var Err = /** @class */ (function () {
    function Err(err) {
        this.kind = "Err";
        this.err = err;
    }
    return Err;
}());
function impossible(x) {
    return x;
}

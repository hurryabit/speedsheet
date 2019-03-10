"use strict";
var logArea;
var formulaInput;
var formulaFieldSet;
var formulaForm;
var sheetTable;
var selectedCell;
// Handler for clicking on cells.
function onSelectCell(event) {
    var target = event.target;
    if (target.tagName === "TD") {
        var previousCell = selectedCell;
        selectedCell = target;
        previousCell.classList.remove("table-primary");
        selectedCell.classList.add("table-primary");
        selectedCell.focus();
        formulaInput.value = selectedCell.dataset.formula;
        formulaFieldSet.disabled = true;
        return true;
    }
    else {
        selectedCell.focus();
        return false;
    }
}
function onEditCell(event) {
    if (onSelectCell(event)) {
        formulaFieldSet.disabled = false;
        formulaInput.focus();
        formulaInput.select();
    }
}
function onKeypressCell(event) {
    if (event.key === "Enter") {
        onEditCell(event);
    }
}
function onKeydownCell(event) {
    var selectedRow = selectedCell.parentNode;
    var rowIndex = selectedRow.rowIndex;
    var cellIndex = selectedCell.cellIndex;
    switch (event.key) {
        case "ArrowLeft": {
            cellIndex -= 1;
            break;
        }
        case "ArrowUp": {
            rowIndex -= 1;
            break;
        }
        case "ArrowRight": {
            cellIndex += 1;
            break;
        }
        case "ArrowDown": {
            rowIndex += 1;
            break;
        }
        default:
            return;
    }
    var nextRow = sheetTable.rows[rowIndex];
    if (nextRow) {
        var nextCell = nextRow.children[cellIndex];
        if (nextCell) {
            nextCell.click();
        }
    }
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
    sheetTable = document.querySelector("#sheet");
    selectedCell = document.querySelector("#A1");
    logArea = document.querySelector("#log");
    var clearButton = document.querySelector("#clear");
    formulaInput = document.querySelector("#formula");
    formulaFieldSet = document.querySelector("#formula_fieldset");
    formulaForm = document.querySelector("#formula_form");
    // Set up log widget.
    logArea.style.height = sheetTable.getBoundingClientRect().height.toString() + "px";
    clearLog();
    clearButton.addEventListener("click", function () { return clearLog(); });
    // Install handler for clicking on table cells.
    document.querySelectorAll("td").forEach(function (cell) { return cell.tabIndex = -1; });
    sheetTable.addEventListener("click", onSelectCell);
    sheetTable.addEventListener("dblclick", onEditCell);
    sheetTable.addEventListener("keypress", onKeypressCell);
    sheetTable.addEventListener("keydown", onKeydownCell);
    formulaInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
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

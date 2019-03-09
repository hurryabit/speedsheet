"use strict";
var logArea;
var coordInput;
var formulaInput;
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
    var newCell = $(event.target);
    var newCoord = newCell.prop("id");
    // Get old coordinate and set new coordinate.
    var oldCoord = coordInput.value;
    coordInput.value = newCoord;
    // Adjust highlighted cell.
    if (oldCoord !== "") {
        $("#" + oldCoord).removeClass("table-primary");
    }
    newCell.addClass("table-primary");
    newCell.focus();
    // Copy cell value into input field.
    formulaInput.value = newCell.attr("data-formula");
    $("#formula_fieldset").prop("disabled", true);
}
function onEditCell(event) {
    onSelectCell(event);
    $("#formula_fieldset").prop("disabled", false);
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
function selectedCell() {
    return document.querySelector("#" + coordInput.value);
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
    logArea = document.querySelector("#log");
    var clearButton = document.querySelector("#clear");
    coordInput = document.querySelector("#coord");
    formulaInput = document.querySelector("#formula");
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
            selectedCell().click();
        }
    });
    selectedCell().click();
    $("#formula_form").submit(function (event) {
        event.preventDefault();
        $.ajax({
            data: $("#formula_form").serializeArray(),
            dataType: "json",
            method: "post",
            url: "update"
        })
            .done(function (data) {
            switch (data.kind) {
                case "Ok": {
                    log("> " + coordInput.value + " = " + formulaInput.value);
                    for (var _i = 0, _a = data.ok; _i < _a.length; _i++) {
                        var entry = _a[_i];
                        $("#" + entry.coord).text(entry.to);
                        log(entry.coord + " = " + entry.to);
                    }
                    selectedCell().dataset.formula = formulaInput.value;
                    selectedCell().click();
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

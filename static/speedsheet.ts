let logArea: HTMLTextAreaElement;
let coordInput: HTMLInputElement;
let formulaInput: HTMLInputElement;
let formulaFieldSet: HTMLFieldSetElement;
let formulaForm: HTMLFormElement;

enum Key {
    ENTER = 13,
    ESCAPE = 27,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40,
}

// Handler for clicking on cells.
function onSelectCell(event: Event) {
    const newCell: JQuery<Element> = $(event.target as Element);
    const newCoord = newCell.prop("id");

    // Get old coordinate and set new coordinate.
    const oldCoord: string = coordInput.value;
    coordInput.value = newCoord;

    // Adjust highlighted cell.
    if (oldCoord !== "") {
        $("#" + oldCoord).removeClass("table-primary");
    }
    newCell.addClass("table-primary");
    newCell.focus();

    // Copy cell value into input field.
    formulaInput.value = newCell.attr("data-formula")!;

    formulaFieldSet.disabled = true;
}

function onEditCell(event: Event) {
    onSelectCell(event);
    formulaFieldSet.disabled = false;
    formulaInput.focus();
    formulaInput.select();
}

function onKeypressCell(event: any) {
    if (event.which === Key.ENTER) {
        $(event.target).dblclick();
    }
}

function onKeydownCell(event: any) {
    const oldCoord: string = (event.target as Element).id;
    let newCoord: string;

    switch (event.which) {
        case Key.LEFT: {
          newCoord = String.fromCharCode(oldCoord.charCodeAt(0) - 1) + oldCoord.substring(1);
          break;
        }
        case Key.UP: {
          const row = parseInt(oldCoord.substring(1), 10);
          newCoord = oldCoord.charAt(0) + (row - 1).toString();
          break;
        }
        case Key.RIGHT: {
          newCoord = String.fromCharCode(oldCoord.charCodeAt(0) + 1) + oldCoord.substring(1);
          break;
        }
        case Key.DOWN: {
          const row = parseInt(oldCoord.substring(1), 10);
          newCoord = oldCoord.charAt(0) + (row + 1).toString();
          break;
        }
        default:
            return;
    }

    $("#" + newCoord).click();
}

function selectedCell(): HTMLTableCellElement {
    return document.querySelector("#" + coordInput.value) as HTMLTableCellElement;
}

function log(msg: string) {
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
    const sheetTable: HTMLTableElement = document.querySelector("#sheet") as HTMLTableElement;

    logArea = document.querySelector("#log") as HTMLTextAreaElement;
    const clearButton: Element = document.querySelector("#clear")!;

    coordInput = document.querySelector("#coord") as HTMLInputElement;
    formulaInput = document.querySelector("#formula") as HTMLInputElement;
    formulaFieldSet = document.querySelector("#formula_fieldset") as HTMLFieldSetElement;
    formulaForm = document.querySelector("#formula_form") as HTMLFormElement;

    // Set up log widget.
    $(logArea).outerHeight($(sheetTable).outerHeight()!);
    clearLog();
    clearButton.addEventListener("click", () => clearLog());

    // Install handler for clicking on table cells.
    $("td").each((_, cell) => {
        $(cell).prop("tabindex", -1);

        $(cell).on("click", onSelectCell);
        $(cell).on("dblclick", onEditCell);
        $(cell).on("keypress", onKeypressCell);
        $(cell).on("keydown", onKeydownCell);
    });

    formulaInput.addEventListener("keydown", (event) => {
        if (event.which === Key.ESCAPE) {
            event.preventDefault();
            selectedCell().click();
        }
    });

    selectedCell().click();

    formulaForm.addEventListener("submit", (event) => {
        event.preventDefault();
        $.ajax({
            data: $(formulaForm).serializeArray(),
            dataType: "json",
            method: "post",
            url: "update",
        })
        .done((data: Result<Log, string>) => {
          switch (data.kind) {
              case "Ok": {
                  log("> " + coordInput.value + " = " + formulaInput.value);
                  for (const entry of data.ok) {
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
        .fail((xhr, status, error) => { alert("Connection to server failed: " + error); });
    });
}

class Ok<T> {
    public kind: "Ok" = "Ok";
    public ok: T;
    constructor(ok: T) {
        this.ok = ok;
    }
}

interface LogEntry {
  coord: string;
  from: number;
  to: number;
}

type Log = Array<LogEntry>;

class Err<E> {
    public kind: "Err" = "Err";
    public err: E;
    constructor(err: E) {
        this.err = err;
    }
}

type Result <T, E> = Ok<T> | Err<E>;

function impossible(x: never): never {
    return x;
}

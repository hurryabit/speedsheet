let logArea: HTMLTextAreaElement;
let formulaInput: HTMLInputElement;
let formulaFieldSet: HTMLFieldSetElement;
let formulaForm: HTMLFormElement;
let sheetTable: HTMLTableElement;
let selectedCell: HTMLTableCellElement;

// Handler for clicking on cells.
function onSelectCell(event: Event) {
    const target = event.target as Element;
    if (target.tagName === "TD") {
        const previousCell = selectedCell;
        selectedCell = target as HTMLTableCellElement;

        previousCell.classList.remove("table-primary");
        selectedCell.classList.add("table-primary");
        selectedCell.focus();

        formulaInput.value = selectedCell.dataset.formula!;
        formulaFieldSet.disabled = true;
        return true;
    }
    else {
        selectedCell.focus()
        return false;
    }
}

function onEditCell(event: Event) {
    if (onSelectCell(event)) {
        formulaFieldSet.disabled = false;
        formulaInput.focus();
        formulaInput.select();
    }
}

function onKeypressCell(event: KeyboardEvent) {
    if (event.key === "Enter") {
        onEditCell(event);
    }
}

function onKeydownCell(event: KeyboardEvent) {
    const selectedRow = selectedCell.parentNode as HTMLTableRowElement;
    let rowIndex = selectedRow.rowIndex;
    let cellIndex = selectedCell.cellIndex;

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

    const nextRow = sheetTable.rows[rowIndex];
    if (nextRow) {
        const nextCell = nextRow.children[cellIndex];
        if (nextCell) {
            (nextCell as HTMLElement).click();
        }
    }
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
    sheetTable = document.querySelector("#sheet") as HTMLTableElement;
    selectedCell = document.querySelector("#A1") as HTMLTableCellElement;

    logArea = document.querySelector("#log") as HTMLTextAreaElement;
    const clearButton: Element = document.querySelector("#clear")!;

    formulaInput = document.querySelector("#formula") as HTMLInputElement;
    formulaFieldSet = document.querySelector("#formula_fieldset") as HTMLFieldSetElement;
    formulaForm = document.querySelector("#formula_form") as HTMLFormElement;

    // Set up log widget.
    logArea.style.height = sheetTable.getBoundingClientRect().height.toString() + "px";
    clearLog();
    clearButton.addEventListener("click", () => clearLog());

    // Install handler for clicking on table cells.
    document.querySelectorAll("td").forEach((cell) => cell.tabIndex = -1);
    sheetTable.addEventListener("click", onSelectCell);
    sheetTable.addEventListener("dblclick", onEditCell);
    sheetTable.addEventListener("keypress", onKeypressCell);
    sheetTable.addEventListener("keydown", onKeydownCell);

    formulaInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            event.preventDefault();
            selectedCell.click();
        }
    });

    selectedCell.click();

    formulaForm.addEventListener("submit", (event) => {
        event.preventDefault();
        let body = { coord: selectedCell.id, formula: formulaInput.value };
        fetch("/update", {
            method: "post",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then((data : Result<Log, string>) => {
            switch (data.kind) {
                case "Ok": {
                    log("> " + selectedCell.id + " = " + formulaInput.value);
                    for (const entry of data.ok) {
                        // TODO: Raise an error if the cell does not exist.
                        (document.querySelector("#" + entry.coord) as HTMLTableCellElement).textContent = entry.to.toString();
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
        .catch(error => {
            alert("Connection to server failed: " + error);
        });
    });
}

interface LogEntry {
  coord: string;
  from: number;
  to: number;
}

type Log = Array<LogEntry>;

class Ok<T> {
    public kind: "Ok" = "Ok";
    public ok: T;
    constructor(ok: T) {
        this.ok = ok;
    }
}

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

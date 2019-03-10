use crate::sheet::*;
use pretty_assertions::assert_eq;
use Expr::*;

/// Evaluation using already existing values.
#[test]
fn evaluation() {
    helper::with_sheet_3(|mut sheet, [x, y, z]| {
        let expr = Var(x) + Var(y);
        assert!(sheet.set(&x, Int(1)).is_ok());
        assert!(sheet.set(&y, Int(2)).is_ok());
        assert!(sheet.set(&z, expr.clone()).is_ok());
        assert_eq!(sheet.get(&z).value, 3);
    })
}

/// Changed inputs to cells get propagated.
#[test]
fn propagation() {
    helper::with_sheet_2(|mut sheet, [x, y]| {
        assert!(sheet.set(&y, Var(x)).is_ok());
        assert!(sheet.set(&x, Int(4)).is_ok());
        assert_eq!(sheet.get(&y).value, 4);
    })
}

/// A reference from a cell to itself is detected and the old expression is
/// restored.
#[test]
fn cycle_detection_1() {
    helper::with_sheet_1(|mut sheet, [x]| {
        let expected_sheet = sheet.clone();
        assert!(sheet.set(&x, Var(x) + Int(1)).is_err());
        assert_eq!(sheet, expected_sheet);
    })
}

/// A cycle involving two cells is detect and the old expression and values
/// are restored.
#[test]
fn cycle_detection_2() {
    helper::with_sheet_2(|mut sheet, [x, y]| {
        assert!(sheet.set(&x, Var(y)).is_ok());
        let expected_sheet = sheet.clone();
        assert!(sheet.set(&y, Var(x) + Int(1)).is_err());
        assert_eq!(sheet, expected_sheet);
    })
}

/// A cycle involving three cells is detect and the old expression and values
/// are restored.
#[test]
fn cycle_detection_3() {
    helper::with_sheet_3(|mut sheet, [x, y, z]| {
        assert!(sheet.set(&y, Var(x) + Int(1)).is_ok());
        assert!(sheet.set(&z, Var(x) + Var(y)).is_ok());
        let expected_sheet = sheet.clone();
        assert!(sheet.set(&x, Var(z)).is_err());
        assert_eq!(sheet, expected_sheet);
    })
}

/// A cycle involving three cells is detect and the old expression and values
/// are restored. Since `C1` depends on `A1` directly and indirectly via `B1`,
/// we might update the value of `C1` twice and restore the wrong one. (This
/// happens when we don't go trough the log in reverse order.)
#[test]
fn cycle_detection_4() {
    use helper::{A1, B1, C1, D1};
    let mut sheet = Sheet::new(1, 4);
    assert!(sheet.set(&B1, Var(A1) + Int(1)).is_ok());
    assert!(sheet.set(&C1, Var(A1) + Var(B1)).is_ok());
    assert!(sheet.set(&D1, Var(C1)).is_ok());
    let expected_sheet = sheet.clone();
    assert!(sheet.set(&A1, Var(D1)).is_err());
    assert_eq!(sheet, expected_sheet);
}

/// FIXME: This should not blow up with "Too many steps". However, it does
/// because the current implementation is exponential.
#[test]
fn no_blowup() {
    use helper::{A1, B1, C1, D1};
    let mut sheet = Sheet::new(1, 4);
    assert!(sheet.set(&B1, Var(A1)).is_ok());
    assert!(sheet.set(&C1, Var(A1) + Var(B1)).is_ok());
    assert!(sheet.set(&D1, Var(B1) + Var(C1)).is_ok());
    let expected_sheet = sheet.clone();
    assert_eq!(
        sheet.set(&A1, Int(1)).unwrap_err(),
        "Too many steps".to_string()
    );
    assert_eq!(sheet, expected_sheet);
}

mod helper {
    use crate::sheet::*;

    pub const A1: Coord = Coord { row: 0, col: 0 };
    pub const B1: Coord = Coord { row: 0, col: 1 };
    pub const C1: Coord = Coord { row: 0, col: 2 };
    pub const D1: Coord = Coord { row: 0, col: 3 };

    pub fn with_sheet_1<F>(run_test: F)
    where
        F: Fn(Sheet, [Coord; 1]) -> (),
    {
        let sheet = Sheet::new(1, 1);
        println!("Testing {:?}", [A1.to_string()]);
        run_test(sheet, [A1]);
    }

    pub fn with_sheet_2<F>(run_test: F)
    where
        F: Fn(Sheet, [Coord; 2]) -> (),
    {
        let c = [A1, B1];
        let perms = &[[0, 1], [1, 0]];
        for &[x, y] in perms {
            let sheet = Sheet::new(1, 2);
            let coords = [c[x], c[y]];
            println!("Testing {:?}", coords.iter().map(|c| c.to_string()));
            run_test(sheet, coords);
        }
    }

    pub fn with_sheet_3<F>(run_test: F)
    where
        F: Fn(Sheet, [Coord; 3]) -> (),
    {
        let c = [A1, B1, C1];
        let perms = &[
            [0, 1, 2],
            [0, 2, 1],
            [1, 0, 2],
            [1, 2, 0],
            [2, 0, 1],
            [2, 1, 0],
        ];
        for &[x, y, z] in perms {
            let sheet = Sheet::new(1, 3);
            let coords = [c[x], c[y], c[z]];
            println!("Testing {:?}", coords);
            run_test(sheet, coords);
        }
    }
}

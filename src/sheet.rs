use serde::{Serialize, Serializer};
use std::borrow::Borrow;
use std::collections::HashSet;
use std::collections::VecDeque;
use std::convert::TryFrom;
use std::fmt;
use std::num::ParseIntError;
use std::ops::Add;
use std::str::FromStr;

#[derive(Clone, Copy, Eq, Hash, PartialEq)]
pub struct Coord {
    pub row: usize,
    pub col: usize,
}

impl Coord {
    fn col_to_string(col: usize) -> String {
        if col > 26 {
            panic!("Columns must be at most 26: {}", col);
        }
        char::from(u8::try_from(col).unwrap() + b'A').to_string()
    }
}

impl fmt::Display for Coord {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}{}", Coord::col_to_string(self.col), self.row + 1)
    }
}

impl fmt::Debug for Coord {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        fmt::Display::fmt(self, f)
    }
}

impl Serialize for Coord {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

impl FromStr for Coord {
    type Err = ParseIntError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut it = s.chars();
        let col = u32::from(it.next().unwrap()) as usize - b'A' as usize;
        let row: usize = it.as_str().parse::<usize>()? - 1;
        Ok(Coord { row, col })
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Binop {
    Add,
    Sub,
    Mul,
}

#[derive(Clone, Eq, PartialEq)]
pub enum Expr {
    Int(i64),
    Var(Coord),
    Binop(Binop, Box<Expr>, Box<Expr>),
}

impl Add for Expr {
    type Output = Expr;

    fn add(self, other: Expr) -> Expr {
        Expr::binop(Binop::Add, self, other)
    }
}

impl Expr {
    fn binop(op: Binop, e1: Expr, e2: Expr) -> Expr {
        Expr::Binop(op, Box::new(e1), Box::new(e2))
    }

    fn build_vars(&self, mut acc: &mut HashSet<Coord>) {
        match self {
            Expr::Int(_) => (),
            Expr::Var(x) => {
                acc.insert(*x);
            }
            Expr::Binop(_, e1, e2) => {
                e1.build_vars(&mut acc);
                e2.build_vars(&mut acc);
            }
        }
    }

    fn vars(&self) -> HashSet<Coord> {
        let mut acc = HashSet::new();
        self.build_vars(&mut acc);
        acc
    }

    fn pretty_with(&self, all_parens: bool, prec: usize, acc: &mut String) {
        match self {
            Expr::Int(n) => acc.push_str(&n.to_string()),
            Expr::Var(x) => acc.push_str(&x.to_string()),
            Expr::Binop(op, e1, e2) => {
                let (parens, left_prec, right_prec, sym) = match op {
                    Binop::Add => (prec > 0, 0, 0, '+'),
                    Binop::Sub => (prec > 0, 0, 1, '-'),
                    Binop::Mul => (prec > 0, 1, 1, '*'),
                };
                let parens = parens || all_parens;
                if parens {
                    acc.push('(');
                }
                e1.pretty_with(all_parens, left_prec, acc);
                acc.push(sym);
                e2.pretty_with(all_parens, right_prec, acc);
                if parens {
                    acc.push(')');
                }
            }
        }
    }

    pub fn pretty(&self) -> String {
        let mut acc = String::new();
        self.pretty_with(false, 0, &mut acc);
        acc
    }

    pub fn debug(&self) -> String {
        let mut acc = String::new();
        self.pretty_with(true, 0, &mut acc);
        acc
    }
}

impl FromStr for Expr {
    type Err = parser::ParseError;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        parser::expr(input)
    }
}

impl fmt::Display for Expr {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.pretty())
    }
}

impl fmt::Debug for Expr {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.debug())
    }
}

#[allow(clippy::all)]
mod parser {
    include!(concat!(env!("OUT_DIR"), "/expr_parser.rs"));
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Cell {
    pub expr: Expr,
    pub value: i64,
    rev_deps: HashSet<Coord>,
}

impl Cell {
    fn new() -> Self {
        Cell {
            expr: Expr::Int(0),
            value: 0,
            rev_deps: HashSet::new(),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Sheet {
    pub num_cols: usize,
    pub cells: Vec<Vec<Cell>>,
}

impl Sheet {
    pub fn new(num_rows: usize, num_cols: usize) -> Self {
        let mut cells = Vec::new();
        cells.resize_with(num_rows, || {
            let mut row = Vec::new();
            row.resize_with(num_cols, Cell::new);
            row
        });
        Sheet { num_cols, cells }
    }

    pub fn get(&self, coord: &Coord) -> &Cell {
        &self.cells[coord.row as usize][coord.col as usize]
    }

    fn get_mut(&mut self, coord: &Coord) -> &mut Cell {
        &mut self.cells[coord.row as usize][coord.col as usize]
    }

    fn eval(&self, expr: &Expr) -> i64 {
        match expr {
            Expr::Int(n) => *n,
            Expr::Var(x) => self.get(x).value,
            Expr::Binop(op, e1, e2) => {
                let v1 = self.eval(e1.borrow());
                let v2 = self.eval(e2.borrow());
                match op {
                    Binop::Add => v1 + v2,
                    Binop::Sub => v1 - v2,
                    Binop::Mul => v1 * v2,
                }
            }
        }
    }

    /// Replace the expression in a given cell and update the reverse
    /// dependencies. Returns the old expression.
    fn replace_expr(&mut self, coord: &Coord, mut expr: Expr) -> Expr {
        let cell = self.get(coord);
        let old_deps = cell.expr.vars();
        let new_deps = expr.vars();
        for dep in old_deps.difference(&new_deps) {
            self.get_mut(dep).rev_deps.remove(coord);
        }
        for dep in new_deps.difference(&old_deps) {
            self.get_mut(dep).rev_deps.insert(*coord);
        }
        let cell = self.get_mut(coord);
        std::mem::swap(&mut cell.expr, &mut expr);
        expr
    }

    fn update_values(&mut self, coord: &Coord) -> (Result<(), String>, Log) {
        let mut log = Vec::new();
        let max_steps = self.cells.len() * self.num_cols;
        let mut steps = 0;
        let mut queue = VecDeque::new();
        queue.push_back(*coord);
        while let Some(cur_coord) = queue.pop_front() {
            if steps > max_steps {
                return (Err("Too many steps".to_string()), log);
            }
            steps += 1;
            let cell = self.get(&cur_coord);
            let value = self.eval(&cell.expr);
            for rev_dep in &cell.rev_deps {
                if rev_dep == coord {
                    return (Err("Circular dependencies".to_string()), log);
                }
                queue.push_back(*rev_dep);
            }
            log.push(LogEntry {
                coord: cur_coord,
                from: cell.value,
                to: value,
            });
            self.get_mut(&cur_coord).value = value;
        }
        (Ok(()), log)
    }

    pub fn set(&mut self, coord: &Coord, expr: Expr) -> Result<Log, String> {
        let old_expr = self.replace_expr(coord, expr);
        let (res, log) = self.update_values(coord);
        match res {
            Ok(()) => Ok(log),
            Err(msg) => {
                self.replace_expr(coord, old_expr);
                for entry in log.iter().rev() {
                    self.get_mut(&entry.coord).value = entry.from;
                }
                Err(msg)
            }
        }
    }
}

#[derive(Clone, Copy, Debug, Serialize)]
pub struct LogEntry {
    coord: Coord,
    from: i64,
    #[allow(dead_code)]
    to: i64,
}

pub type Log = Vec<LogEntry>;

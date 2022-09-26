(module
    (export "sumMultiples" (func $sumMultiples))
    (global $MAX i32 (i32.const 1000))
    (func $sumMultiples (result i64)
        (local $sum i64)
        (local $n i32)
        (local.set $sum (i64.const 0))
        (local.set $n (i32.const 0))
        (block (loop
            (br_if 1 (i32.eqz (local.get $n) (global.get $MAX) (i32.lt_s)))
            (local.get $n) (i32.const 3) (i32.rem_s) (i32.const 0) (i32.eq) (local.get $n) (i32.const 5) (i32.rem_s) (i32.const 0) (i32.eq) (i32.or)
            (if (then
                (local.set $sum (local.get $sum) (local.get $n) (i64.extend_i32_s) (i64.add))
            ))
            (local.set $n (local.get $n) (i32.const 1) (i32.add))
            (br 0)
        ))
        (local.get $sum)
    )
)

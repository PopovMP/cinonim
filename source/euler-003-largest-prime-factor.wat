(module
    (export "largestPrimeFactor" (func $largestPrimeFactor))
    (func $largestPrimeFactor (param $n i32) (result i32)
        (local $factor i32)
        (local.set $factor (i32.const 2))
        (block (loop
            (br_if 1 (i32.eqz (local.get $n) (i32.const 1) (i32.gt_s)))
            (local.get $n) (local.get $factor) (i32.rem_s) (i32.const 0) (i32.eq)
            (if (then
                (local.set $n (local.get $n) (local.get $factor) (i32.div_s))
            )(else
                (local.set $factor (local.get $factor) (i32.const 1) (i32.add))
            ))
            (br 0)
        ))
        (local.get $factor)
    )
)

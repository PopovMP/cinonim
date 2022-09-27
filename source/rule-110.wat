(module
    (import "js" "setCell" (func $setCell (param i32) (param i32)))
    (import "js" "printTable" (func $printTable ))
    (export "rule110" (func $rule110))
    (global $SIZE i32 (i32.const 100))
    (memory 1)
    (func $logTable
        (local $i i32)
        (local.set $i (i32.const 0))
        (block (loop
            (br_if 1 (i32.eqz (local.get $i) (global.get $SIZE) (i32.lt_s)))
            (local.get $i)
            (i32.load (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))))
            (call $setCell)
            (local.set $i (local.get $i) (i32.const 1) (i32.add))
            (br 0)
        ))
        
        (call $printTable)
    )
    (func $initTable
        (local $i i32)
        (local.set $i (i32.const 0))
        (block (loop
            (br_if 1 (i32.eqz (local.get $i) (global.get $SIZE) (i32.lt_s)))
            (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (i32.const 0))
            (local.set $i (local.get $i) (i32.const 1) (i32.add))
            (br 0)
        ))
        (i32.store (i32.add (i32.const 0) (i32.shl (global.get $SIZE) (i32.const 1) (i32.sub) (i32.const 2))) (i32.const 1))
    )
    (func $rule110 (param $maxCycles i32)
        (local $i i32)
        (local $cycle i32)
        (local $pattern i32)
        (local $temp i32)
        
        (call $initTable)
        
        (call $logTable)
        (local.set $cycle (i32.const 0))
        (block (loop
            (br_if 1 (i32.eqz (local.get $cycle) (local.get $maxCycles) (i32.lt_s)))
            (local.set $temp (i32.load (i32.add (i32.const 0) (i32.shl (i32.const 0) (i32.const 2)))))
            (local.set $i (i32.const 1))
            (block (loop
                (br_if 1 (i32.eqz (local.get $i) (global.get $SIZE) (i32.const 1) (i32.sub) (i32.lt_s)))
                (local.set $pattern (i32.const 100) (local.get $temp) (i32.mul) (i32.const 10) (i32.load (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2)))) (i32.mul) (i32.add) (i32.load (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 1) (i32.add) (i32.const 2)))) (i32.add))
                (local.set $temp (i32.load (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2)))))
                (local.get $pattern) (i32.const 111) (i32.eq)
                (if (then
                    (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (i32.const 0))
                ))
                (local.get $pattern) (i32.const 110) (i32.eq)
                (if (then
                    (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (i32.const 1))
                ))
                (local.get $pattern) (i32.const 101) (i32.eq)
                (if (then
                    (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (i32.const 1))
                ))
                (local.get $pattern) (i32.const 100) (i32.eq)
                (if (then
                    (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (i32.const 0))
                ))
                (local.get $pattern) (i32.const 11) (i32.eq)
                (if (then
                    (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (i32.const 1))
                ))
                (local.get $pattern) (i32.const 10) (i32.eq)
                (if (then
                    (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (i32.const 1))
                ))
                (local.get $pattern) (i32.const 1) (i32.eq)
                (if (then
                    (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (i32.const 1))
                ))
                (local.get $pattern) (i32.const 0) (i32.eq)
                (if (then
                    (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (i32.const 0))
                ))
                (local.set $i (local.get $i) (i32.const 1) (i32.add))
                (br 0)
            ))
            
            (call $logTable)
            (local.set $cycle (local.get $cycle) (i32.const 1) (i32.add))
            (br 0)
        ))
    )
)
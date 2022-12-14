(module
    (export "largestPalindrome" (func $largestPalindrome))
    (func $isPalindrome (param $num i32) (result i32)
        (local $m i32)
        (local $n i32)
        (local $p i32)
        (local $q i32)
        (local.set $m (i32.const 100000) (local.get $num) (i32.const 10) (i32.rem_s) (i32.mul))
        (local.set $n (i32.const 1000) (local.get $num) (i32.const 100) (i32.rem_s) (local.get $num) (i32.const 10) (i32.rem_s) (i32.sub) (i32.mul))
        (local.set $p (i32.const 10) (local.get $num) (i32.const 1000) (i32.rem_s) (local.get $num) (i32.const 100) (i32.rem_s) (i32.sub) (i32.mul))
        (local.set $q (local.get $num) (i32.const 1000) (i32.rem_s))
        (local.get $m) (local.get $n) (i32.add) (local.get $p) (i32.add) (local.get $q) (i32.add) (local.get $num) (i32.eq)
    )
    (func $largestPalindrome (result i32)
        (local $a i32)
        (local $b i32)
        (local $product i32)
        (local $palindrome i32)
        (local $steps i32)
        (local.set $palindrome (i32.const 0))
        (local.set $steps (i32.const 0))
        (local.set $a (i32.const 999))
        (block (loop
            (br_if 1 (i32.eqz (local.get $a) (i32.const 99) (i32.gt_s)))
            (local.set $b (i32.const 999))
            (block (loop
                (br_if 1 (i32.eqz (local.get $b) (i32.const 99) (i32.gt_s)))
                (local.set $product (local.get $a) (local.get $b) (i32.mul))
                (local.set $steps (local.get $steps) (i32.const 1) (i32.add))
                (local.get $product)
                (call $isPalindrome) (local.get $product) (local.get $palindrome) (i32.gt_s) (i32.and)
                (if (then
                    (local.set $palindrome (local.get $product))
                ))
                (local.set $b (local.get $b) (i32.const 1) (i32.sub))
                (br 0)
            ))
            (local.set $a (local.get $a) (i32.const 1) (i32.sub))
            (br 0)
        ))
        (local.get $palindrome)
    )
)
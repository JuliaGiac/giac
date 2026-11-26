/*
 * This file is part of the MicroPython project, http://micropython.org/
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013, 2014 Damien P. George
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

#include <stdio.h>

#include "py/mpstate.h"
#include "py/gc.h"

#if MICROPY_ENABLE_GC

// Even if we have specific support for an architecture, it is
// possible to force use of setjmp-based implementation.
#if !MICROPY_GCREGS_SETJMP

// We capture here callee-save registers, i.e. ones which may contain
// interesting values held there by our callers. It doesn't make sense
// to capture caller-saved registers, because they, well, put on the
// stack already by the caller.
#if defined(__x86_64__)
typedef mp_uint_t regs_t[6];

STATIC void gc_helper_get_regs(regs_t arr) {
#ifdef __clang__
    // Named register variables for rbp/rbx are rejected by newer Clang.
    // Write callee-saved registers directly to memory via inline asm.
    __asm__ volatile (
        "movq %%rbx, %0\n\t"
        "movq %%rbp, %1\n\t"
        "movq %%r12, %2\n\t"
        "movq %%r13, %3\n\t"
        "movq %%r14, %4\n\t"
        "movq %%r15, %5"
        : "=m"(arr[0]), "=m"(arr[1]), "=m"(arr[2]),
          "=m"(arr[3]), "=m"(arr[4]), "=m"(arr[5])
    );
#else
    register long rbx asm ("rbx");
    register long rbp asm ("rbp");
    register long r12 asm ("r12");
    register long r13 asm ("r13");
    register long r14 asm ("r14");
    register long r15 asm ("r15");
    arr[0] = rbx;
    arr[1] = rbp;
    arr[2] = r12;
    arr[3] = r13;
    arr[4] = r14;
    arr[5] = r15;
#endif
}

#elif defined(__i386__)

typedef mp_uint_t regs_t[4];

STATIC void gc_helper_get_regs(regs_t arr) {
#ifdef __clang__
    __asm__ volatile (
        "movl %%ebx, %0\n\t"
        "movl %%esi, %1\n\t"
        "movl %%edi, %2\n\t"
        "movl %%ebp, %3"
        : "=m"(arr[0]), "=m"(arr[1]), "=m"(arr[2]), "=m"(arr[3])
    );
#else
    register long ebx asm ("ebx");
    register long esi asm ("esi");
    register long edi asm ("edi");
    register long ebp asm ("ebp");
    arr[0] = ebx;
    arr[1] = esi;
    arr[2] = edi;
    arr[3] = ebp;
#endif
}

#elif defined(__thumb2__) || defined(__thumb__) || defined(__arm__)

typedef mp_uint_t regs_t[10];

STATIC void gc_helper_get_regs(regs_t arr) {
    register long r4 asm ("r4");
    register long r5 asm ("r5");
    register long r6 asm ("r6");
    register long r7 asm ("r7");
    register long r8 asm ("r8");
    register long r9 asm ("r9");
    register long r10 asm ("r10");
    register long r11 asm ("r11");
    register long r12 asm ("r12");
    register long r13 asm ("r13");
    arr[0] = r4;
    arr[1] = r5;
    arr[2] = r6;
    arr[3] = r7;
    arr[4] = r8;
    arr[5] = r9;
    arr[6] = r10;
    arr[7] = r11;
    arr[8] = r12;
    arr[9] = r13;
}

#else

// If we don't have architecture-specific optimized support,
// just fall back to setjmp-based implementation.
#undef MICROPY_GCREGS_SETJMP
#define MICROPY_GCREGS_SETJMP (1)

#endif // Arch-specific selection
#endif // !MICROPY_GCREGS_SETJMP

// If MICROPY_GCREGS_SETJMP was requested explicitly, or if
// we enabled it as a fallback above.
#if MICROPY_GCREGS_SETJMP
#include <setjmp.h>

typedef jmp_buf regs_t;

STATIC void gc_helper_get_regs(regs_t arr) {
    setjmp(arr);
}

#endif // MICROPY_GCREGS_SETJMP

// this function is used by mpthreadport.c
void gc_collect_regs_and_stack(void);

void gc_collect_regs_and_stack(void) {
    regs_t regs;
    gc_helper_get_regs(regs);
    // GC stack (and regs because we captured them)
    void **regs_ptr = (void**)(void*)&regs;
    gc_collect_root(regs_ptr, ((uintptr_t)MP_STATE_THREAD(stack_top) - (uintptr_t)&regs) / sizeof(uintptr_t));
}

void gc_collect(void) {
    //gc_dump_info();

    gc_collect_start();
    gc_collect_regs_and_stack();
    #if MICROPY_PY_THREAD
    mp_thread_gc_others();
    #endif
    gc_collect_end();

    //printf("-----\n");
    //gc_dump_info();
}

#endif //MICROPY_ENABLE_GC

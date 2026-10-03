import math

# ---- Bernoulli Numbers ----
BERNOULLI = [1, -1/2, 1/6, 0, -1/30, 0, 1/42, 0, -1/30, 0, 5/66]

def bernoulli_poly(k, x):
    val = 0
    binom = 1
    for j in range(k+1):
        if j > 0:
            binom = binom * (k - j + 1) / j
        val += binom * (BERNOULLI[j] if j < len(BERNOULLI) else 0) * x**(k - j)
    return val

def hurwitz_zeta_neg(k, a):
    return -bernoulli_poly(k + 1, a) / (k + 1)

# ---- Tests ----
def near(a, b, tol, msg):
    diff = abs(a - b)
    if diff > tol:
        print(f"FAIL: {msg} -- got {a}, expected {b}, diff={diff:.3e}")
    else:
        print(f"PASS: {msg} -- got {a} (diff={diff:.3e})")

print("=== Bernoulli Polynomial Tests ===")
near(bernoulli_poly(0, 0.5), 1, 1e-14, "B_0(0.5) = 1")
near(bernoulli_poly(1, 0), -0.5, 1e-14, "B_1(0) = -1/2")
near(bernoulli_poly(1, 1), 0.5, 1e-14, "B_1(1) = 1/2")
near(bernoulli_poly(2, 0), 1/6, 1e-14, "B_2(0) = 1/6")
near(bernoulli_poly(2, 1), 1/6, 1e-14, "B_2(1) = 1/6")

print("\n=== Hurwitz zeta(-k, 1) = zeta(-k) Tests ===")
near(hurwitz_zeta_neg(0, 1), -0.5, 1e-14, "zeta(0) = -1/2")
near(hurwitz_zeta_neg(1, 1), -1/12, 1e-14, "zeta(-1) = -1/12")
near(hurwitz_zeta_neg(2, 1), 0, 1e-14, "zeta(-2) = 0")
near(hurwitz_zeta_neg(3, 1), 1/120, 1e-14, "zeta(-3) = 1/120")
near(hurwitz_zeta_neg(4, 1), 0, 1e-14, "zeta(-4) = 0")

print("\n=== T001: a_n=1, Reg = zeta(0) = -1/2 ===")
# Sum_{n=1}^{inf} 1 = sum of n^0 = zeta(-0, 1) = zeta(0) = -1/2
# For m=1, d=0: coefficients[0] = [1] (constant 1)
# r=0: contribution = c[0] * m^0 * zeta(0, 1) = 1 * 1 * (-1/2) = -1/2
val = hurwitz_zeta_neg(0, 1)  # = -B_1(1)/1 = -0.5/1 = -0.5
near(val, -0.5, 1e-14, "T001 Hurwitz: sum 1 = -1/2")

print("\n=== T002: a_n=n, Reg = zeta(-1) = -1/12 ===")
# m=1, d=1: coeff r=0 -> [0, 1] meaning a_n = 0 + 1*n
# contribution = 0*zeta(0,1) + 1 * 1^1 * zeta(-1, 1) = -1/12
val = hurwitz_zeta_neg(1, 1)
near(val, -1/12, 1e-14, "T002 Hurwitz: sum n = -1/12")

print("\n=== T003: a_n=n^2, Reg = zeta(-2) = 0 ===")
val = hurwitz_zeta_neg(2, 1)
near(val, 0, 1e-14, "T003 Hurwitz: sum n^2 = 0")

print("\n=== T201: a_n=1+n, Reg = -1/2 + (-1/12) = -7/12 ===")
val = hurwitz_zeta_neg(0, 1) + hurwitz_zeta_neg(1, 1)
near(val, -7/12, 1e-14, "T201 Hurwitz: sum(1+n) = -7/12")

print("\n=== T202: a_n=3n, Reg = 3*(-1/12) = -1/4 ===")
val = 3 * hurwitz_zeta_neg(1, 1)
near(val, -1/4, 1e-14, "T202 Hurwitz: sum(3n) = -1/4")

print("\n=== T703: a_n=(-1)^n ===")
# (-1)^n, period 2: r=0 -> n even -> a_n=1, r=1 -> n odd -> a_n=-1
# r=0: sum_{n even} 1 = sum_{j=1}^inf 1 when n=2j -> zeta(0,1) via m=2
# Actually: (-1)^n with n starting at 1:
# n=1: -1, n=2: 1, n=3: -1, n=4: 1 ...
# period 2: r=1 (n odd) -> a_n = -1, r=0 (n even) -> a_n = 1
# Hurwitz: sum_{n=1,n odd} (-1) + sum_{n=1,n even} 1
# r=1: c = [-1], sum = -1 * 2^0 * zeta(0, 1/2) = -zeta(0, 1/2)
# r=0: c = [1], sum = 1 * 2^0 * zeta(0, 1) = zeta(0, 1)
# zeta(0, a) = -B_1(a) = -(a - 1/2) = 1/2 - a
z01 = hurwitz_zeta_neg(0, 1)      # = 1/2 - 1 = -1/2
z0half = hurwitz_zeta_neg(0, 0.5)  # = 1/2 - 1/2 = 0
print(f"zeta(0, 1) = {z01}")
print(f"zeta(0, 1/2) = {z0half}")
val_alt = -z0half + z01  # = 0 + (-1/2) = -1/2
near(val_alt, -0.5, 1e-14, "T703 Hurwitz: sum(-1)^n = -1/2")

print("\n=== T101: a_n = (n%2==0)?1:0 ===")
# period 2: r=0 (n even) -> 1, r=1 (n odd) -> 0
# sum = 1 * 2^0 * zeta(0, 1) = zeta(0, 1) = -1/2
# Wait, this just sums over even n.
# More carefully: sum_{n=1}^{inf} a_n where a_n = 1 if n even, 0 if odd
# = sum_{n even, n>=2} 1 = zeta(0) computed over n=2,4,6,...
# In Hurwitz framework with m=2: r=0 means n≡0 mod 2 (even), c=[1]
# contribution = 1 * 2^0 * zeta(0, 0/2) -> but r=0 uses a=1
val_mod2 = hurwitz_zeta_neg(0, 1)  # r=0, m=2: a = 1 (since r=0 -> 2,4,6,... -> j=1,2,3,... -> zeta(0,1))
near(val_mod2, -0.5, 1e-14, "T101: sum over even n of 1 = -1/2")
# NOTE: total ζ(0) = -1/2, and even-only should give -1/2 as well? Let's verify:
# Sum_{n=1}^{inf} 1 = -1/2 (all n)
# Sum_{n even} 1 = sum_{j=1}^inf 1 = -1/2 (same series!)
# Sum_{n odd} 1 = sum_{j=0}^inf 1 -> zeta(0, 1/2) via Hurwitz with m=2
# Wait: sum_{n odd} 1 = sum_{j=0}^inf 1/(2j+1)^0 ... this needs more care
# Actually sum_{n=1}^inf = sum_{n even} + sum_{n odd}
# = (-1/2) = sum_even + sum_odd = -1/2 + z0half... so z0half should = 0
# which it is! So sum_even = -1/2, sum_odd = 0
print(f"Check: sum_all = sum_even + sum_odd = {val_mod2} + {z0half} = {val_mod2 + z0half}")

print("\n=== Exp Cutoff Simulation for T001 ===")
N = 4096
# To ensure tail is < 1e-10, we need eps * N > 23. Let's use 25/N as min eps.
eps_min = max(0.001, 25 / N)
eps_vals = [eps_min * (0.5/eps_min)**(i/59) for i in range(60)]
s_eps = [sum(math.exp(-eps * n) for n in range(1, N+1)) for eps in eps_vals]
# For a_n = 1: S(eps) = sum e^{-eps*n} = e^{-eps}/(1-e^{-eps}) 
# ≈ 1/eps - 1/2 + eps/12 - ...
# So c_0 = -1/2
# Let's check the first and last S(eps) values
print(f"S(eps=0.001) = {s_eps[0]:.6f} (expect ~1/0.001 - 0.5 = 999.5)")
print(f"S(eps=0.5) = {s_eps[-1]:.6f}")

# Simple fit: S(eps) ~ c_{-1}/eps + c_0 + c_1*eps
# Use 3 basis functions: 1/eps, 1, eps
import numpy as np
A = np.array([[1/e, 1, e] for e in eps_vals])
b = np.array(s_eps)
coeffs, _, _, _ = np.linalg.lstsq(A, b, rcond=None)
print(f"Fit: c_{{-1}}={coeffs[0]:.6f}, c_0={coeffs[1]:.10f}, c_1={coeffs[2]:.6f}")
near(coeffs[1], -0.5, 1e-4, "T001 ExpCutoff c_0 = -0.5")

print("\n=== Exp Cutoff for T002: a_n = n ===")
s_eps2 = [sum(n * math.exp(-eps * n) for n in range(1, N+1)) for eps in eps_vals]
# S(eps) ~ 1/eps^2 - 1/12 + ...
A2 = np.array([[1/e**2, 1/e, 1, e] for e in eps_vals])
b2 = np.array(s_eps2)
coeffs2, _, _, _ = np.linalg.lstsq(A2, b2, rcond=None)
print(f"Fit: c_{{-2}}={coeffs2[0]:.4f}, c_{{-1}}={coeffs2[1]:.4f}, c_0={coeffs2[2]:.10f}, c_1={coeffs2[3]:.4f}")
near(coeffs2[2], -1/12, 1e-3, "T002 ExpCutoff c_0 = -1/12")

print("\n=== Done ===")

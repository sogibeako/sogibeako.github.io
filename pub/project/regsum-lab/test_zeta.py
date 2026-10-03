import math

# ---- Riemann Zeta Functional Equation for Re(s) < 0 ----
# ζ(s) = 2^s * π^(s-1) * sin(πs/2) * Γ(1-s) * ζ(1-s)

# Using a simple Dirichlet series for ζ(z) where Re(z) > 1
# Since we only need it for moderately small z (e.g., z=2.5 for s=-1.5)
def zeta_direct(z, terms=100000):
    s = 0
    for n in range(1, terms + 1):
        s += 1 / (n ** z)
    return s

# Γ(z) approximation using Lanczos or just math.gamma
def gamma(z):
    return math.gamma(z)

def riemann_zeta_neg(s):
    # s < 0
    if s >= 0:
        raise ValueError("Use this only for s < 0")
    
    # 2^s * π^(s-1) * sin(πs/2) * Γ(1-s) * ζ(1-s)
    term1 = 2**s
    term2 = math.pi**(s - 1)
    term3 = math.sin(math.pi * s / 2)
    term4 = gamma(1 - s)
    term5 = zeta_direct(1 - s)  # e.g., for s=-1.5, we need zeta(2.5)
    
    return term1 * term2 * term3 * term4 * term5

# For s = -1.5
val_15 = riemann_zeta_neg(-1.5)
print(f"zeta(-1.5) = {val_15}")

# For integer values to verify consistency
print(f"zeta(-1) = {riemann_zeta_neg(-1)}")
# expected: -1/12 = -0.08333...

# For s = -0.5
val_05 = riemann_zeta_neg(-0.5)
print(f"zeta(-0.5) = {val_05}")

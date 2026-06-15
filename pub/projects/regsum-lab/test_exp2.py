import math
import numpy as np

def exp_cutoff(seq, alpha):
    N = len(seq)
    # matching JS
    eps_min = max(0.001, 25 / N)
    eps_max = 0.5
    samples = 60
    
    eps_grid = []
    ratio = math.pow(eps_max / eps_min, 1 / (samples - 1))
    for i in range(samples):
        eps_grid.append(eps_min * math.pow(ratio, i))
        
    s_eps = []
    for eps in eps_grid:
        s = sum(seq[i] * math.exp(-eps * (i + 1)) for i in range(N))
        s_eps.append(s)
        
    # Basis: eps^-(alpha+1), eps^-alpha, eps^-1, log(eps), 1, eps
    A = []
    for eps in eps_grid:
        A.append([
            math.pow(eps, -(alpha + 1)),
            math.pow(eps, -alpha),
            math.pow(eps, -1),
            math.log(eps),
            1,
            eps
        ])
        
    A = np.array(A)
    b = np.array(s_eps)
    
    AtA = A.T @ A
    Atb = A.T @ b
    
    maxDiag = np.max(np.diag(AtA))
    lambda_val = maxDiag * 1e-12
    # Add regularizer
    np.fill_diagonal(AtA, np.diag(AtA) + lambda_val)
    
    coeffs = np.linalg.solve(AtA, Atb)
    
    c0 = coeffs[4] # index of '1'
    
    fitted = A @ coeffs
    fit_res = b - fitted
    rms = np.sqrt(np.mean(fit_res**2))
    
    print(f"Regularized ExpCutoff value: {c0:.5f}, RMS: {rms:.2e}")

N = 4096
seq = [math.pow(n, 1.5) for n in range(1, N + 1)]
exp_cutoff(seq, 1.5)

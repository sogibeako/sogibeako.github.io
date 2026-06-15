import math

def fit_extended_skeleton(seq):
    N = len(seq)
    # Start at 10% or at least 10 to avoid early noise, but not 50% which might cross the end bound
    start = max(10, int(N * 0.1)) 
    end = min(N, 2048)
    
    # If start >= end, meaning sequence is small, adjust
    if start >= end:
        start = max(1, end // 2)
    
    sumX = 0
    sumY = 0
    sumXY = 0
    sumX2 = 0
    count = 0
    
    for i in range(start, end):
        val = abs(seq[i])
        if val < 1e-10:
            continue
        x = math.log(i + 1)
        y = math.log(val)
        sumX += x
        sumY += y
        sumX2 += x * x
        sumXY += x * y
        count += 1
        
    if count < 10:
        print("Fail: count < 10")
        return None
        
    slope = (count * sumXY - sumX * sumY) / (count * sumX2 - sumX * sumX + 1e-30)
    
    meanY = sumY / count
    meanX = sumX / count
    log_c = meanY - slope * meanX
    
    c_abs = math.exp(log_c)
    
    sign = 1
    for i in range(start, end):
        if abs(seq[i]) >= 1e-10:
            sign = 1 if seq[i] > 0 else -1
            break
            
    c = c_abs * sign
    
    totalRSS = 0
    for i in range(N):
        pred = c * math.pow(i + 1, slope)
        totalRSS += (seq[i] - pred)**2
        
    rmsRes = math.sqrt(totalRSS / N)
    isNonInteger = abs(slope - round(slope)) > 0.05
    
    print(f"Extended fit: count={count}, slope={slope:.4f}, c={c:.4f}, rms={rmsRes:.2e}, non_int={isNonInteger}")
    
    if rmsRes < 1e-4 and isNonInteger: # Relaxed slightly for float
        return {
            'type': 'extended', 'exponent': slope, 'coefficient': c, 'rms': rmsRes,
            'confidence': 'good' if rmsRes < 1e-5 else 'uncertain'
        }
    return None

def test_n15():
    N = 4096
    seq = [math.pow(n, 1.5) for n in range(1, N + 1)]
    res = fit_extended_skeleton(seq)
    print("RES:", res)

print("Testing n^1.5...")
test_n15()

print("Testing n^2... (expect None since integer)")
N = 4096
seq2 = [math.pow(n, 2) for n in range(1, N + 1)]
print("RES:", fit_extended_skeleton(seq2))

# What about negative c?
print("Testing -2 * n^1.5...")
N = 4096
seq3 = [-2 * math.pow(n, 1.5) for n in range(1, N + 1)]
print("RES:", fit_extended_skeleton(seq3))

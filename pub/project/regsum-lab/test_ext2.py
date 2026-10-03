import math

# JS logic test
# Let's see what happens

def test_full():
    N = 4096
    seq = [math.pow(n, 1.5) for n in range(1, N + 1)]
    
    # from engine.js fitExtendedSkeleton
    start = max(10, int(N * 0.1))
    end = min(N, 2048)
    if start >= end:
        start = max(1, end // 2)
        
    sumX, sumY, sumXY, sumX2 = 0, 0, 0, 0
    count = 0
    for i in range(start, end):
        val = abs(seq[i])
        x = math.log(i + 1)
        y = math.log(val)
        sumX += x
        sumY += y
        sumX2 += x * x
        sumXY += x * y
        count += 1
        
    slope = (count * sumXY - sumX * sumY) / (count * sumX2 - sumX * sumX + 1e-30)
    
    meanY = sumY / count
    meanX = sumX / count
    log_c = meanY - slope * meanX
    c_abs = math.exp(log_c)
    c = c_abs
    
    totalRSS = 0
    for i in range(N):
        pred = c * math.pow(i + 1, slope)
        totalRSS += (seq[i] - pred)**2
        
    rmsRes = math.sqrt(totalRSS / N)
    print(f"Test output >> alpha={slope}, c={c}, rms={rmsRes}")

test_full()

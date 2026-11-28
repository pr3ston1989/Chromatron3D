"""World-space cross sections shared by the forge terrain and molten runs."""
from math import pi, sin


CHANNEL_ORIGIN = -23

# (Z, center X, half-width, lava height). The right run starts immediately
# below the spillway lip. The upper run recedes out of the camera's orbit.
CHANNELS = (
    ((-101,25.0,1.0,-17.65),(-68,23.0,1.55,-17.28),(-48,19.4,2.38,-16.94),
     (-36,15.6,1.79,-16.64),(-28,12.8,2.08,-16.47),(-20,10.4,1.91,-16.37),
     (-14,11.8,1.31,-16.27),(-8.5,12.6,.48,-16.27)),
    ((5.6,29.9,1.06,-16.51),(8.7,30.6,1.85,-16.53),(11.7,32.4,2.10,-16.60),
     (15.0,33.8,1.83,-16.74),(20.7,35.1,2.46,-16.92),(27.8,39.3,2.09,-17.08),
     (38.4,43.1,2.75,-17.31),(58,44.6,2.78,-17.70),(74,44.1,2.53,-18.02)),
)


def section(run, z):
    """Read an interpolated channel cross section at the given world Z."""
    for (start,x0,w0,y0),(end,x1,w1,y1) in zip(run,run[1:]):
        if start<=z<=end:
            t = (z-start)/(end-start)
            center = x0+(x1-x0)*t+.22*sin(z*.77)*sin(t*pi)
            width = w0+(w1-w0)*t+.12*sin(z*1.09)*sin(t*pi)
            return center,width,y0+(y1-y0)*t
    return None

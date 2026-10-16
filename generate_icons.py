import os
import math
from PIL import Image, ImageDraw

def create_astra_icon():
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded container
    bg_color = (13, 17, 23, 255)      # Deep obsidian
    border_color = (30, 41, 59, 255)  # Subtle border
    r = 96
    draw.rounded_rectangle([16, 16, size - 16, size - 16], radius=r, fill=bg_color, outline=border_color, width=4)

    # Stylized Orbital ring (cyan/blue ellipse)
    cx, cy = size // 2, size // 2 + 10
    orbit_rx, orbit_ry = 180, 70
    
    # Draw orbit trail
    for angle_deg in range(0, 360, 2):
        rad = math.radians(angle_deg)
        # Rotated 25 degrees
        rot = math.radians(-25)
        raw_x = orbit_rx * math.cos(rad)
        raw_y = orbit_ry * math.sin(rad)
        px = cx + raw_x * math.cos(rot) - raw_y * math.sin(rot)
        py = cy + raw_x * math.sin(rot) + raw_y * math.cos(rot)
        
        # Depth shading
        if math.sin(rad) > 0:
            c = (0, 212, 255, 220)  # Bright cyan
            dot_r = 4
        else:
            c = (14, 116, 144, 140)  # Darker cyan behind
            dot_r = 3
        draw.ellipse([px - dot_r, py - dot_r, px + dot_r, py + dot_r], fill=c)

    # Geometric Stylized "A"
    # Apex: (256, 100)
    # Bottom Left: (140, 380)
    # Bottom Right: (372, 380)
    # Inner Cutout & Crossbar
    
    # Outer polygon
    outer_poly = [
        (256, 95),   # Top tip
        (375, 385),  # Bottom right outer
        (325, 385),  # Bottom right inner
        (292, 305),  # Crossbar right
        (220, 305),  # Crossbar left
        (187, 385),  # Bottom left inner
        (137, 385),  # Bottom left outer
    ]
    # Astra gradient fill for the "A": primary cyan to royal blue
    draw.polygon(outer_poly, fill=(0, 210, 255, 255))

    # Inner triangle cutout
    inner_cutout = [
        (256, 165),
        (280, 260),
        (232, 260),
    ]
    draw.polygon(inner_cutout, fill=bg_color)

    # Crossbar accent (glowing sapphire bar)
    draw.line([(205, 318), (307, 318)], fill=(56, 189, 248, 255), width=10)
    # Core star / node at apex
    draw.ellipse([256 - 9, 95 - 9, 256 + 9, 95 + 9], fill=(255, 255, 255, 255))
    draw.ellipse([256 - 5, 95 - 5, 256 + 5, 95 + 5], fill=(0, 229, 255, 255))

    # Save to src-tauri/icons and public/
    os.makedirs("src-tauri/icons", exist_ok=True)
    os.makedirs("public", exist_ok=True)

    sizes = [16, 32, 48, 64, 128, 256, 512]
    icon_images = []

    for s in sizes:
        resized = img.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(f"src-tauri/icons/{s}x{s}.png")
        if s == 32:
            resized.save("public/favicon.png")
            resized.save("src-tauri/icons/32x32.png")
        if s == 128:
            resized.save("src-tauri/icons/128x128.png")
            resized.save("src-tauri/icons/128x128@2x.png")
        icon_images.append(resized)

    # Save .ico file
    img.save("src-tauri/icons/icon.ico", format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
    img.save("public/icon.png")
    print("AstraIDE branding icons created successfully.")

if __name__ == "__main__":
    create_astra_icon()

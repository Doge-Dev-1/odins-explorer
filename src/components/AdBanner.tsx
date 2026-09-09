type AdBannerProps = {
  unitId: string;
  width?: number;
  height?: number;
};

export default function AdBanner({
  unitId,
  width = 300,
  height = 250,
}: AdBannerProps) {
  return (
    <div className="w-full my-6 flex justify-center">
      <iframe
        data-aa={unitId}
        src={`https://ad.a-ads.com/${unitId}/?size=${width}x${height}`}
        width={width}
        height={height}
        style={{
          border: 0,
          padding: 0,
          width: `${width}px`,
          height: `${height}px`,
          overflow: "hidden",
          display: "block",
        }}
        title="Advertisement"
      />
    </div>
  );
}

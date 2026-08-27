type AdBannerProps = {
  unitId?: string;
};

export default function AdBanner({ unitId = "2453487" }: AdBannerProps) {
  return (
    <div className="w-full my-6" style={{ position: "relative", zIndex: 1 }}>
      <iframe
        data-aa={unitId}
        src={`https://acceptable.a-ads.com/${unitId}/?size=Adaptive`}
        style={{
          border: 0,
          padding: 0,
          width: "70%",
          height: "auto",
          overflow: "hidden",
          display: "block",
          margin: "auto",
        }}
        title="Advertisement"
      />
    </div>
  );
}

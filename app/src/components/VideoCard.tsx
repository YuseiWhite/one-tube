type Props = {
  title: string;
  thumb?: string;
  priceLabel?: string;
  onPurchase?: () => void;
  disabled?: boolean;
};

export default function VideoCard({ title, thumb, priceLabel, onPurchase, disabled }: Props) {
  return (
    <div className='card'>
      <img className='thumb' src={thumb} alt={title} onError={(e)=>{(e.currentTarget as HTMLImageElement).style.visibility='hidden';}} />
      <div className='row' style={{marginTop:10}}>
        <div>
          <div style={{fontWeight:700}}>{title}</div>
          {priceLabel && <div className='kv'>Price: <span className='price'>{priceLabel}</span></div>}
        </div>
        {onPurchase && (
          <button className='btn primary' onClick={onPurchase} disabled={disabled}>
            {disabled ? '購入中...' : '購入する'}
          </button>
        )}
      </div>
    </div>
  );
}


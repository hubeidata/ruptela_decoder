export const containerStyle = {
  position: "relative" as const,
  width: "100%",
  height: "calc(100vh - 60px)",
  marginTop: "60px",
  pointerEvents: "auto" as const,
};

export const panelStyles = {
  container: {
    position: 'absolute' as const,
    top: '10px',
    left: '10px',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    overflow: 'hidden' as const,
  },
  header: {
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  content: {
    overflow: 'hidden' as const,
    transition: 'max-height 0.3s ease',
  },
  statusInfo: {
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
  },
  waitingMessage: {
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '12px',
    padding: '20px',
    backgroundColor: '#fafafa',
    borderRadius: '6px',
    border: '1px dashed #ddd'
  },
  legend: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
    fontSize: '10px',
    color: '#666'
  }
};

export const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    position: 'relative' as const
  },
  closeButton: {
    position: 'absolute' as const,
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '5px',
    borderRadius: '50%',
    width: '35px',
    height: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export const truckIconStyles = {
  container: {
    cursor: 'pointer',
    position: 'relative' as const,
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pulseAnimation: {
    position: 'absolute' as const,
    top: '-15px',
    left: '-15px',
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    opacity: 0.4,
    animation: 'pulse 2s infinite',
    zIndex: -1
  },
  mainCircle: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden' as const
  },
  truckImage: {
    width: '40px',
    height: '40px',
    objectFit: 'contain' as const,
    objectPosition: 'center',
    transformOrigin: 'center',
    imageRendering: 'auto' as const,
    transition: 'transform 0.3s ease'
  },
  statusBadge: {
    position: 'absolute' as const,
    top: '-5px',
    right: '-5px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    color: 'white',
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  tooltip: {
    position: 'absolute' as const,
    top: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    whiteSpace: 'nowrap' as const,
    opacity: 0,
    transition: 'opacity 0.3s',
    pointerEvents: 'none' as const,
    zIndex: 1000
  }
};

export const getStatusColors = (status: 'active' | 'loading' | 'idle') => {
  switch (status) {
    case 'active':
      return { border: '#4caf50', shadow: '#81c784', pulse: '#c8e6c9' };
    case 'loading':
      return { border: '#ff9800', shadow: '#ffb74d', pulse: '#ffe0b2' };
    default:
      return { border: '#757575', shadow: '#bdbdbd', pulse: '#f5f5f5' };
  }
};
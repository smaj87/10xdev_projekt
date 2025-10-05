export interface GoogleTagPubadsReturnInterface {
  refresh: () => void;
  enableSingleRequest: () => void;
  collapseEmptyDivs: () => void;
  addEventListener: (eventName: string, callback: (e: any) => void) => void;
  setRequestNonPersonalizedAds: (param: number) => void;
  getSlots: () => any[];
  addService: (param: GoogleTagPubadsReturnInterface) => void;
  setTargeting: (
    param1: string,
    param2: string[] | string,
  ) => GoogleTagPubadsReturnInterface;
}

export const PsikologProfileSettingsDefault = ({ className, ...props }) => {
  return (
    <div
      className={"bg-[#ffffff] h-[810px] relative overflow-hidden " + className}
    >
      <div className="bg-[#f7f7f9] w-[59px] h-[810px] absolute left-0 top-0"></div>
      <div className="flex flex-col gap-[25px] items-start justify-start w-[59px] absolute left-0 top-[142px]">
        <div className="pr-5 pl-5 flex flex-col gap-2.5 items-center justify-start self-stretch shrink-0 relative">
          <div className="flex flex-row gap-[15px] items-center justify-start shrink-0 relative">
            <img
              className="rounded-[50%] shrink-0 w-[37px] h-[37px] relative"
              style={{ objectFit: "cover" }}
              src="oval0.png"
            />
          </div>
        </div>
        <div
          className="border-solid border-text border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] self-stretch shrink-0 h-0 relative"
          style={{ marginTop: "-0.5px" }}
        ></div>
        <div className="pr-2 pl-2 flex flex-col gap-[25px] items-center justify-center self-stretch shrink-0 h-[571px] relative">
          <div className="pr-[15px] pl-[15px] flex flex-row gap-3.5 items-center justify-start shrink-0 relative">
            <img
              className="shrink-0 w-[30px] h-[30px] relative overflow-visible"
              style={{ aspectRatio: "1" }}
              src="bar-chart0.svg"
            />
          </div>
          <div className="bg-primary-v1 pr-[15px] pl-[15px] flex flex-row gap-3.5 items-center justify-start shrink-0 w-[59px] h-[41px] relative">
            <img
              className="shrink-0 w-[30px] h-[30px] relative overflow-visible"
              style={{ aspectRatio: "1" }}
              src="frame-person0.svg"
            />
          </div>
          <div className="pr-[15px] pl-[15px] flex flex-row gap-3.5 items-center justify-start shrink-0 relative">
            <img
              className="shrink-0 w-[30px] h-[30px] relative overflow-visible"
              style={{ aspectRatio: "1" }}
              src="calendar-month0.svg"
            />
          </div>
          <div className="flex flex-col items-start justify-between flex-1 relative">
            <div className="pr-[15px] pl-[15px] flex flex-row gap-3.5 items-center justify-start shrink-0 relative">
              <img
                className="shrink-0 w-[30px] h-[30px] relative overflow-visible"
                style={{ aspectRatio: "1" }}
                src="brightness-50.svg"
              />
            </div>
            <div className="p-[15px] flex flex-row gap-3.5 items-center justify-start shrink-0 relative">
              <img
                className="shrink-0 w-[30px] h-[30px] relative overflow-visible"
                style={{ aspectRatio: "1" }}
                src="brightness-51.svg"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="text-primary-v1 text-left font-['PublicSans-SemiBold',_sans-serif] text-xl leading-[21px] font-semibold absolute left-[138px] top-[92px]">
        Informasi Diri{" "}
      </div>
      <div
        className="border-solid border-text border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] w-[1138px] h-0 absolute left-[282px] top-[99px]"
        style={{
          marginTop: "-0.5px",
          transformOrigin: "0 0",
          transform: "rotate(0deg) scale(1, 1)",
        }}
      ></div>
      <div className="w-[97.38px] h-[97.38px] static">
        <img
          className="rounded-[50%] w-[97.38px] h-[97.38px] absolute left-[258px] top-[136px]"
          style={{ objectFit: "cover", aspectRatio: "1" }}
          src="oval1.png"
        />
        <div className="w-[22.55px] h-[22.55px] static">
          <div
            className="bg-primary-v1 rounded-[50%] w-[22.55px] h-[22.55px] absolute left-[332.83px] top-[204.68px]"
            style={{ aspectRatio: "1" }}
          ></div>
          <img
            className="w-[22.55px] h-[22.55px] absolute left-[332.83px] top-[204.68px] overflow-visible"
            style={{ aspectRatio: "1" }}
            src="photo-camera0.svg"
          />
        </div>
      </div>
      <div className="flex flex-row gap-[76px] items-start justify-start absolute left-[257px] top-[286px]">
        <div className="flex flex-col gap-5 items-start justify-center shrink-0 w-[454px] relative">
          <div className="flex flex-col gap-2.5 items-start justify-start self-stretch shrink-0 relative">
            <div className="text-text text-left font-['PublicSans-Light',_sans-serif] text-xs font-light relative self-stretch">
              Nama Lengkap{" "}
            </div>
            <div className="bg-[#ffffff] rounded-[5px] border-solid border-[#dfdfdf] border pt-[7px] pr-2.5 pb-[7px] pl-2.5 flex flex-row gap-2.5 items-center justify-center self-stretch shrink-0 h-[49px] relative">
              <div className="flex flex-row gap-3 items-center justify-start flex-1 relative">
                <div className="flex flex-row gap-2.5 items-center justify-start shrink-0 w-[382px] relative">
                  <div className="text-[#dbdbdb] text-left font-['PublicSans-Light',_sans-serif] text-base font-light relative">
                    Restu Al Oji .MPsi. Psikolog{" "}
                  </div>
                </div>
                <div
                  className="border-solid border-[#a3a3a3] border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] shrink-0 w-[34px] h-0 relative"
                  style={{
                    marginTop: "-0.5px",
                    transformOrigin: "0 0",
                    transform: "rotate(90deg) scale(1, 1)",
                  }}
                ></div>
                <img
                  className="shrink-0 w-[27px] h-[27px] relative overflow-visible"
                  style={{ aspectRatio: "1" }}
                  src="account-circle0.svg"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 items-start justify-start self-stretch shrink-0 relative">
            <div className="text-text text-left font-['PublicSans-Light',_sans-serif] text-xs font-light relative self-stretch">
              Email{" "}
            </div>
            <div className="bg-[#ffffff] rounded-[5px] border-solid border-[#dfdfdf] border pt-[7px] pr-2.5 pb-[7px] pl-2.5 flex flex-row gap-2.5 items-center justify-center self-stretch shrink-0 h-[49px] relative">
              <div className="flex flex-row gap-3 items-center justify-start flex-1 relative">
                <div className="flex flex-row gap-2.5 items-center justify-start shrink-0 w-[382px] relative">
                  <div className="text-[#dbdbdb] text-left font-['PublicSans-Light',_sans-serif] text-base font-light relative">
                    restu@gmail.com{" "}
                  </div>
                </div>
                <div
                  className="border-solid border-[#a3a3a3] border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] shrink-0 w-[34px] h-0 relative"
                  style={{
                    marginTop: "-0.5px",
                    transformOrigin: "0 0",
                    transform: "rotate(90deg) scale(1, 1)",
                  }}
                ></div>
                <img
                  className="shrink-0 w-[23.86px] h-[19.09px] relative overflow-visible"
                  style={{ aspectRatio: "23.86/19.09" }}
                  src="mail0.svg"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 items-start justify-start self-stretch shrink-0 relative">
            <div className="text-text text-left font-['PublicSans-Light',_sans-serif] text-xs font-light relative self-stretch">
              No. SIPP (Surat Izin Praktik Psikolog){" "}
            </div>
            <div className="bg-[#ffffff] rounded-[5px] border-solid border-[#dfdfdf] border pt-[7px] pr-2.5 pb-[7px] pl-2.5 flex flex-row gap-2.5 items-center justify-center self-stretch shrink-0 h-[49px] relative">
              <div className="flex flex-row gap-3 items-center justify-start flex-1 relative">
                <div className="flex flex-row gap-2.5 items-center justify-start shrink-0 w-[382px] relative">
                  <div className="text-[#d8d8d8] text-left font-['PublicSans-Light',_sans-serif] text-base font-light relative">
                    3255511451100{" "}
                  </div>
                </div>
                <div
                  className="border-solid border-[#a3a3a3] border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] shrink-0 w-[34px] h-0 relative"
                  style={{
                    marginTop: "-0.5px",
                    transformOrigin: "0 0",
                    transform: "rotate(90deg) scale(1, 1)",
                  }}
                ></div>
                <img
                  className="shrink-0 w-[27px] h-[21.6px] relative overflow-visible"
                  style={{ aspectRatio: "5/4" }}
                  src="id-card0.svg"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 items-start justify-start self-stretch shrink-0 relative">
            <div className="flex flex-col gap-2.5 items-start justify-start self-stretch shrink-0 relative">
              <div className="text-text text-left font-['PublicSans-Light',_sans-serif] text-xs font-light relative self-stretch">
                No. STR (Surat Tanda Registrasi){" "}
              </div>
              <div className="bg-[#ffffff] rounded-[5px] border-solid border-[#dfdfdf] border pt-[7px] pr-2.5 pb-[7px] pl-2.5 flex flex-row gap-2.5 items-center justify-center self-stretch shrink-0 h-[49px] relative">
                <div className="flex flex-row gap-3 items-center justify-start flex-1 relative">
                  <div className="flex flex-row items-center justify-start shrink-0 w-[382px] relative">
                    <div className="text-[#d8d8d8] text-left font-['PublicSans-Light',_sans-serif] text-base font-light relative"></div>
                    <div
                      className="text-[#d8d8d8] text-left font-['PublicSans-Light',_sans-serif] text-base font-light relative"
                      style={{ margin: "0 0 0 -5px" }}
                    >
                      3255511451100{" "}
                    </div>
                  </div>
                  <div
                    className="border-solid border-[#a3a3a3] border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] shrink-0 w-[34px] h-0 relative"
                    style={{
                      marginTop: "-0.5px",
                      transformOrigin: "0 0",
                      transform: "rotate(90deg) scale(1, 1)",
                    }}
                  ></div>
                  <img
                    className="shrink-0 w-[27px] h-[21.6px] relative overflow-visible"
                    style={{ aspectRatio: "5/4" }}
                    src="id-card1.svg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5 items-start justify-center shrink-0 w-[453px] relative">
          <div className="flex flex-col gap-2.5 items-start justify-start self-stretch shrink-0 relative">
            <div className="text-text text-left font-['PublicSans-Light',_sans-serif] text-xs font-light relative self-stretch">
              Keahlian Bidang{" "}
            </div>
            <div className="bg-[#ffffff] rounded-[5px] border-solid border-[#dfdfdf] border pt-[7px] pr-2.5 pb-[7px] pl-2.5 flex flex-row gap-2.5 items-center justify-center self-stretch shrink-0 h-[49px] relative">
              <div className="flex flex-row gap-3 items-center justify-start flex-1 relative">
                <div className="flex flex-row gap-2.5 items-center justify-start shrink-0 w-[382px] relative">
                  <div className="text-[#dbdbdb] text-left font-['PublicSans-Light',_sans-serif] text-base font-light relative">
                    Konseling Karir{" "}
                  </div>
                </div>
                <div
                  className="border-solid border-[#a3a3a3] border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] shrink-0 w-[34px] h-0 relative"
                  style={{
                    marginTop: "-0.5px",
                    transformOrigin: "0 0",
                    transform: "rotate(90deg) scale(1, 1)",
                  }}
                ></div>
                <img
                  className="shrink-0 w-[23.68px] h-[23.68px] relative overflow-visible"
                  style={{ aspectRatio: "1" }}
                  src="award-star0.svg"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 items-start justify-start self-stretch shrink-0 relative">
            <div className="text-text text-left font-['PublicSans-Light',_sans-serif] text-xs font-light relative self-stretch">
              Spesialisasi{" "}
            </div>
            <div className="bg-[#ffffff] rounded-[5px] border-solid border-[#dfdfdf] border pt-[7px] pr-2.5 pb-[7px] pl-2.5 flex flex-row gap-2.5 items-center justify-center self-stretch shrink-0 h-[49px] relative">
              <div className="flex flex-row gap-3 items-center justify-start flex-1 relative">
                <div className="flex flex-row gap-2.5 items-center justify-start shrink-0 w-[382px] relative">
                  <div className="text-[#dbdbdb] text-left font-['PublicSans-Light',_sans-serif] text-base font-light relative">
                    Konseling Karir{" "}
                  </div>
                </div>
                <div
                  className="border-solid border-[#a3a3a3] border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] shrink-0 w-[34px] h-0 relative"
                  style={{
                    marginTop: "-0.5px",
                    transformOrigin: "0 0",
                    transform: "rotate(90deg) scale(1, 1)",
                  }}
                ></div>
                <img
                  className="shrink-0 w-5 h-[26.25px] relative overflow-visible"
                  style={{ aspectRatio: "20/26.25" }}
                  src="license0.svg"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 items-start justify-start self-stretch shrink-0 relative">
            <div className="text-text text-left font-['PublicSans-Light',_sans-serif] text-xs font-light relative self-stretch">
              Jenis Praktik{" "}
            </div>
            <div className="bg-[#ffffff] rounded-[5px] border-solid border-[#dfdfdf] border pt-[7px] pr-2.5 pb-[7px] pl-2.5 flex flex-row gap-2.5 items-center justify-center self-stretch shrink-0 h-[49px] relative">
              <div className="flex flex-row gap-3 items-center justify-start flex-1 relative">
                <div className="flex flex-row gap-2.5 items-center justify-start shrink-0 w-[382px] relative">
                  <div className="text-[#dbdbdb] text-left font-['PublicSans-Light',_sans-serif] text-base font-light relative">
                    Konseling Karir{" "}
                  </div>
                </div>
                <div
                  className="border-solid border-[#a3a3a3] border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] shrink-0 w-[34px] h-0 relative"
                  style={{
                    marginTop: "-0.5px",
                    transformOrigin: "0 0",
                    transform: "rotate(90deg) scale(1, 1)",
                  }}
                ></div>
                <img
                  className="shrink-0 w-[23px] h-[21.85px] relative overflow-visible"
                  style={{ aspectRatio: "23/21.85" }}
                  src="business-center0.svg"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 items-start justify-start self-stretch shrink-0 relative">
            <div className="text-text text-left font-['PublicSans-Light',_sans-serif] text-xs font-light relative self-stretch">
              Lama Praktik{" "}
            </div>
            <div className="bg-[#ffffff] rounded-[5px] border-solid border-[#dfdfdf] border pt-[7px] pr-2.5 pb-[7px] pl-2.5 flex flex-row gap-2.5 items-center justify-center self-stretch shrink-0 h-[49px] relative">
              <div className="flex flex-row gap-3 items-center justify-start flex-1 relative">
                <div className="flex flex-row gap-2.5 items-center justify-start shrink-0 w-[382px] relative">
                  <div className="text-[#dbdbdb] text-left font-['PublicSans-Light',_sans-serif] text-base font-light relative">
                    5 Tahun{" "}
                  </div>
                </div>
                <div
                  className="border-solid border-[#a3a3a3] border-t-[0.5px] border-r-[0] border-b-[0] border-l-[0] shrink-0 w-[34px] h-0 relative"
                  style={{
                    marginTop: "-0.5px",
                    transformOrigin: "0 0",
                    transform: "rotate(90deg) scale(1, 1)",
                  }}
                ></div>
                <img
                  className="shrink-0 w-6 h-6 relative overflow-visible"
                  style={{ aspectRatio: "1" }}
                  src="clock-loader-100.svg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-primary-v1 rounded-[5px] pt-[3px] pr-1.5 pb-[3px] pl-1.5 flex flex-row gap-[11px] items-center justify-center w-[82px] h-7 absolute left-[calc(50%_-_-438px)] top-[643px]">
        <div className="text-[#ffffff] text-left font-['PublicSans-SemiBold',_sans-serif] text-xs leading-[21px] font-semibold relative flex items-center justify-start">
          Edit{" "}
        </div>
      </div>
      <div className="flex flex-row gap-[23px] items-center justify-start absolute left-[1240px] top-[29px]">
        <div className="shrink-0 w-[106px] h-[26px] relative">
          <div className="bg-primary-v1 rounded-[39px] border-solid border-primary-v1 border w-[106px] h-[26px] absolute left-0 top-0"></div>
          <div className="flex flex-row gap-0 items-center justify-start w-[106px] h-[26px] absolute left-0 top-0">
            <div className="flex flex-col gap-2.5 items-center justify-center shrink-0 w-[53px] h-[26px] relative">
              <div className="flex flex-row gap-0.5 items-center justify-center self-stretch shrink-0 relative">
                <div className="text-[#ffffff] text-center font-['PublicSans-Regular',_sans-serif] text-sm leading-[21px] font-normal relative flex items-center justify-center">
                  EN{" "}
                </div>
              </div>
            </div>
            <div
              className="bg-[#ffffff] rounded-[20px] p-[5px] flex flex-col gap-2.5 items-center justify-center shrink-0 w-[53px] relative"
              style={{
                boxShadow:
                  "-1px 0px 1px 0px rgba(0, 0, 0, 0.13),  -1px 0px 1px 0px rgba(0, 0, 0, 0.08),  -2px 0px 1px 0px rgba(0, 0, 0, 0.02),  -4px 0px 1px 0px rgba(0, 0, 0, 0.00)",
              }}
            >
              <div className="flex flex-row gap-0.5 items-center justify-center shrink-0 relative">
                <img
                  className="shrink-0 w-4 h-4 relative overflow-visible"
                  style={{ aspectRatio: "1" }}
                  src="emojione-flag-for-indonesia0.svg"
                />
                <div className="text-primary-v1 text-center font-['PublicSans-Bold',_sans-serif] text-sm leading-[21px] font-bold relative flex items-center justify-center">
                  ID{" "}
                </div>
              </div>
            </div>
          </div>
        </div>
        <img
          className="shrink-0 w-8 h-8 relative overflow-visible"
          style={{ aspectRatio: "1" }}
          src="notifications0.svg"
        />
      </div>
    </div>
  );
};

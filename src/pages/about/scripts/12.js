
  (function () {
    const BOGDAN_DATA = {
      role: "CREATIVE PARTNER",
      paragraphs: [
        "Designer turned Creative Director, with a background in advertising and a soft spot for branding and typography. Now mostly busy building brands, questioning briefs and having strong opinions about typefaces, restaurant menus and other things nobody asked about. Occasionally stops thinking about design to play video games. Occasionally.",
      ],
      socials: [
        { name: "Instagram", url: "https://www.instagram.com/bogdan.apalaghiei/" },
        { name: "LinkedIn", url: "https://www.linkedin.com/in/bogdan-apalaghiei-33205a160/" },
      ],
    };

    const DIANA_DATA = {
      role: "CREATIVE PARTNER",
      paragraphs: [
        "Designer and illustrator with a background in advertising, where she spent years as an Art Director. Now working across branding, illustration and motion, with an unreasonable attention to detail and too many opinions about design.",
        "When she’s not designing, she’s cooking, painting, and collecting inspiration from everyday life. Usually the one making a good idea look even better.",
      ],
      socials: [
        { name: "Instagram", url: "https://www.instagram.com/diana_apalaghiei08/" },
        { name: "LinkedIn", url: "https://www.linkedin.com/in/diana-apalaghiei-275066180/" },
      ],
    };

    const ANDREEA_DATA = {
      role: "JR. DESIGNER",
      paragraphs: [
        "Jr. Designer and the newest addition to Two26. Curious, detail-oriented and learning suspiciously fast. Currently turning lots of questions, references and way too many open Figma files into very good work. We’re starting to get concerned.",
      ],
      socials: [
        { name: "LinkedIn", url: "https://www.linkedin.com/in/andreea-liche-55832518a/" },
      ],
    };

    const TEAM_DATA = {
      "bogdan apalaghiei": BOGDAN_DATA,
      "bogdan": BOGDAN_DATA,
      0: BOGDAN_DATA,

      "diana apalaghiei": DIANA_DATA,
      "diana": DIANA_DATA,
      1: DIANA_DATA,

      "andreea liche": ANDREEA_DATA,
      "andreea": ANDREEA_DATA,
      2: ANDREEA_DATA,
    };

    const DEFAULT_DATA = BOGDAN_DATA;

    function initTwo26TeamPopup() {
      if (typeof gsap === "undefined") return;

      const teamCards = Array.from(
        document.querySelectorAll(
          ".team-card, .about-team-btm .team-card, [data-team-card]"
        )
      );

      if (!teamCards.length) return;

      let overlay = document.querySelector(".team-popup-overlay");

      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "team-popup-overlay";

        overlay.innerHTML = `
          <div class="team-popup-card" role="dialog" aria-modal="true">
            <button class="team-popup-close-btn" aria-label="Close popup">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div class="team-popup-img-wrap">
              <img class="team-popup-img" src="" alt="Team Member">
            </div>

            <div class="team-popup-content">
              <div class="team-popup-header">
                <h3 class="team-popup-name"></h3>
                <h4 class="team-popup-role"></h4>
              </div>

              <div class="team-popup-body"></div>

              <div class="team-popup-socials"></div>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
      }

      const card = overlay.querySelector(".team-popup-card");
      const closeBtn = overlay.querySelector(".team-popup-close-btn");
      const imgEl = overlay.querySelector(".team-popup-img");
      const nameEl = overlay.querySelector(".team-popup-name");
      const roleEl = overlay.querySelector(".team-popup-role");
      const bodyEl = overlay.querySelector(".team-popup-body");
      const socialsEl = overlay.querySelector(".team-popup-socials");

      let isOpen = false;
      let expandTl = null;

      const socialIcons = {
        instagram: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M6.465 0.066C7.638 0.012 8.012 0 11 0C13.988 0 14.362 0.013 15.534 0.066C16.706 0.119 17.506 0.306 18.206 0.577C18.939 0.854 19.604 1.287 20.154 1.847C20.714 2.396 21.146 3.06 21.422 3.794C21.694 4.494 21.88 5.294 21.934 6.464C21.988 7.639 22 8.013 22 11C22 13.987 21.987 14.362 21.934 15.535C21.881 16.705 21.694 17.505 21.422 18.205C21.1459 18.939 20.7132 19.6041 20.154 20.154C19.604 20.714 18.939 21.146 18.206 21.422C17.506 21.694 16.706 21.88 15.536 21.934C14.362 21.988 13.988 22 11 22C8.012 22 7.638 21.987 6.465 21.934C5.295 21.881 4.495 21.694 3.795 21.422C3.06096 21.1459 2.39588 20.7132 1.846 20.154C1.28658 19.6045 0.853545 18.9398 0.577 18.206C0.306 17.506 0.12 16.706 0.066 15.536C0.012 14.361 0 13.987 0 11C0 8.013 0.013 7.638 0.066 6.466C0.119 5.294 0.306 4.494 0.577 3.794C0.853838 3.06014 1.28722 2.3954 1.847 1.846C2.3962 1.2867 3.06059 0.853673 3.794 0.577C4.494 0.306 5.295 0.12 6.465 0.066ZM15.444 2.046C14.284 1.993 13.936 1.982 10.999 1.982C8.062 1.982 7.714 1.993 6.554 2.046C5.481 2.095 4.899 2.274 4.511 2.425C3.998 2.625 3.631 2.862 3.246 3.247C2.88073 3.60179 2.59981 4.0341 2.424 4.512C2.273 4.9 2.094 5.482 2.045 6.555C1.992 7.715 1.981 8.063 1.981 11C1.981 13.937 1.992 14.285 2.045 15.445C2.094 16.518 2.273 17.1 2.424 17.488C2.6 17.965 2.881 18.398 3.246 18.753C3.601 19.118 4.034 19.399 4.511 19.575C4.899 19.726 5.481 19.905 6.554 19.954C7.714 20.007 8.061 20.018 10.999 20.018C13.937 20.018 14.284 20.007 15.444 19.954C16.517 19.905 17.099 19.726 17.487 19.575C18 19.375 18.367 19.138 18.752 18.753C19.117 18.398 19.398 17.965 19.574 17.488C19.725 17.1 19.904 16.518 19.953 15.445C20.006 14.285 20.017 13.937 20.017 11C20.017 8.063 20.006 7.715 19.953 6.555C19.904 5.482 19.725 4.9 19.574 4.512C19.374 3.999 19.137 3.632 18.752 3.247C18.3972 2.88173 17.9649 2.60081 17.487 2.425C17.099 2.274 16.517 2.095 15.444 2.046ZM9.594 14.391C10.3787 14.7176 11.2524 14.7617 12.0659 14.5157C12.8795 14.2697 13.5824 13.7489 14.0546 13.0422C14.5268 12.3356 14.7391 11.4869 14.655 10.6411C14.571 9.79534 14.196 9.00497 13.594 8.405C13.2102 8.02148 12.7462 7.72781 12.2353 7.54515C11.7245 7.36248 11.1794 7.29536 10.6395 7.34862C10.0996 7.40187 9.57815 7.57418 9.1128 7.85313C8.64746 8.13208 8.24974 8.51074 7.9483 8.96185C7.64686 9.41296 7.44919 9.92529 7.36952 10.462C7.28984 10.9986 7.33015 11.5463 7.48754 12.0655C7.64493 12.5847 7.91548 13.0626 8.27972 13.4647C8.64396 13.8668 9.09282 14.1832 9.594 14.391ZM7.002 7.002C7.52702 6.47697 8.15032 6.0605 8.8363 5.77636C9.52228 5.49222 10.2575 5.34597 11 5.34597C11.7425 5.34597 12.4777 5.49222 13.1637 5.77636C13.8497 6.0605 14.473 6.47697 14.998 7.002C15.523 7.52702 15.9395 8.15032 16.2236 8.8363C16.5078 9.52228 16.654 10.2575 16.654 11C16.654 11.7425 16.5078 12.4777 16.2236 13.1637C15.9395 13.8497 15.523 14.473 14.998 14.998C13.9377 16.0583 12.4995 16.654 11 16.654C9.50046 16.654 8.06234 16.0583 7.002 14.998C5.94166 13.9377 5.34597 12.4995 5.34597 11C5.34597 9.50046 5.94166 8.06234 7.002 7.002ZM17.908 6.188C18.0381 6.06527 18.1423 5.91768 18.2143 5.75397C18.2863 5.59027 18.3248 5.41377 18.3274 5.23493C18.33 5.05609 18.2967 4.87855 18.2295 4.71281C18.1622 4.54707 18.0624 4.39651 17.936 4.27004C17.8095 4.14357 17.6589 4.04376 17.4932 3.97652C17.3275 3.90928 17.1499 3.87598 16.9711 3.87858C16.7922 3.88119 16.6157 3.91965 16.452 3.9917C16.2883 4.06374 16.1407 4.1679 16.018 4.298C15.7793 4.55103 15.6486 4.88712 15.6537 5.23493C15.6588 5.58274 15.7992 5.91488 16.0452 6.16084C16.2911 6.40681 16.6233 6.54723 16.9711 6.5523C17.3189 6.55737 17.655 6.42669 17.908 6.188Z" fill="#FF5400"/>
</svg>`,

        linkedin: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21.2725 0.150391C22.6809 0.150391 23.8496 1.31911 23.8496 2.72754V21.2725C23.8496 22.6809 22.6809 23.8496 21.2725 23.8496H2.72754C1.31911 23.8496 0.150391 22.6809 0.150391 21.2725V2.72852C0.155784 2.04633 0.428741 1.39352 0.911133 0.911133C1.33331 0.488956 1.88594 0.226532 2.47461 0.164062L2.72852 0.150391H21.2725ZM2.72754 2.03223C2.33379 2.03223 2.03223 2.33379 2.03223 2.72754V21.2695C2.03032 21.3617 2.04666 21.4535 2.08105 21.5391C2.11548 21.6247 2.16718 21.7023 2.23242 21.7676C2.29767 21.8328 2.37533 21.8845 2.46094 21.9189C2.54564 21.953 2.63628 21.9683 2.72754 21.9668V21.9678H21.2725V21.9668C21.3637 21.9683 21.4544 21.953 21.5391 21.9189C21.6247 21.8845 21.7023 21.8328 21.7676 21.7676C21.8328 21.7023 21.8845 21.6247 21.9189 21.5391C21.9533 21.4535 21.9697 21.3617 21.9678 21.2695V2.72754C21.9678 2.33379 21.6662 2.03223 21.2725 2.03223H2.72754ZM15.7832 9.18359C17.3766 9.18359 18.2845 9.69934 18.8057 10.5234C19.3369 11.3635 19.4863 12.5533 19.4863 13.9434V19.4863H16.582V14.5908C16.582 13.9965 16.5787 13.2839 16.3545 12.7207C16.2406 12.4348 16.0676 12.1795 15.8037 11.9971C15.5395 11.8144 15.1967 11.7139 14.7607 11.7139C14.3227 11.7139 13.966 11.7996 13.6787 11.958C13.3905 12.117 13.1804 12.344 13.0303 12.6133C12.7339 13.145 12.668 13.8439 12.668 14.5225V19.4863H9.7627V9.42285H12.5322V10.8535H12.8408L12.8828 10.7744C13.2881 10.0071 14.2786 9.18362 15.7832 9.18359ZM7.45215 9.42285V19.4863H4.51367V9.42285H7.45215ZM5.92871 4.20703C6.37895 4.21789 6.80748 4.40429 7.12207 4.72656C7.43654 5.04878 7.61226 5.4814 7.6123 5.93164C7.6123 6.38186 7.43648 6.81448 7.12207 7.13672C6.80748 7.45899 6.37895 7.64539 5.92871 7.65625C5.69872 7.66179 5.46996 7.62129 5.25586 7.53711C5.04179 7.45293 4.84625 7.3267 4.68164 7.16602C4.51718 7.00538 4.38613 6.81343 4.29688 6.60156C4.2076 6.3896 4.16211 6.16164 4.16211 5.93164C4.16213 5.70163 4.20757 5.47368 4.29688 5.26172C4.38616 5.04982 4.51712 4.85791 4.68164 4.69727C4.84627 4.53656 5.04175 4.41036 5.25586 4.32617C5.46996 4.242 5.69873 4.20149 5.92871 4.20703Z" fill="#FF5400" stroke="#F8EEE8" stroke-width="0.3"/>
</svg>`,
      };

      function openTeamPopup(sourceCard, index) {
        if (isOpen) return;
        isOpen = true;

        if (expandTl) expandTl.kill();

        gsap.set([card, nameEl, roleEl, bodyEl, socialsEl, closeBtn], {
          opacity: 1,
          clearProps: "transform",
        });

        const cardImg = sourceCard.querySelector(
          "img, .team-img-wrap img, [class*='img'] img"
        );

        const cardName = sourceCard.querySelector(
          ".team-name, h2, h3, h4, [class*='name']"
        );

        const cardSub = sourceCard.querySelector(
          ".team-sub, p, [class*='sub'], [class*='role']"
        );

        const memberName =
          cardName && cardName.textContent.trim()
            ? cardName.textContent.trim()
            : "BOGDAN APALAGHIEI";

        const memberRole =
          cardSub && cardSub.textContent.trim()
            ? cardSub.textContent.trim()
            : "";

        const imgSrc = cardImg
          ? cardImg.currentSrc ||
            cardImg.src ||
            cardImg.getAttribute("data-src")
          : "";

        const memberKey = memberName.toLowerCase().trim();
        const firstName = memberKey.split(" ")[0];

        const data =
          TEAM_DATA[memberKey] ||
          TEAM_DATA[firstName] ||
          TEAM_DATA[index] ||
          DEFAULT_DATA;

        if (imgSrc) {
          imgEl.src = imgSrc;
          imgEl.style.display = "block";
        } else {
          imgEl.style.display = "none";
        }

        imgEl.alt = memberName;
        nameEl.textContent = memberName;
        roleEl.textContent = memberRole || data.role;

        const paragraphs =
          data.paragraphs && data.paragraphs.length
            ? data.paragraphs
            : DEFAULT_DATA.paragraphs;

        bodyEl.innerHTML = paragraphs
          .map((para) => `<p>${para}</p>`)
          .join("");

        const socials =
          data.socials && Array.isArray(data.socials)
            ? data.socials.filter(
                (soc) => soc && soc.url && soc.url.trim() !== ""
              )
            : [];

        if (socials.length > 0) {
          socialsEl.style.display = "flex";

          socialsEl.innerHTML = socials
            .map((soc) => {
              const iconKey = soc.name.toLowerCase();
              const iconSvg = socialIcons[iconKey] || "";

              return `
                <a href="${soc.url}" target="_blank" rel="noopener noreferrer" class="team-popup-pill">
                  ${iconSvg}
                  <span>${soc.name}</span>
                </a>
              `;
            })
            .join("");
        } else {
          socialsEl.innerHTML = "";
          socialsEl.style.display = "none";
        }

        overlay.classList.add("is-active");
        overlay.style.display = "flex";

        const sourceRect = sourceCard.getBoundingClientRect();
        const popupRect = card.getBoundingClientRect();

        const dx =
          sourceRect.left +
          sourceRect.width / 2 -
          (popupRect.left + popupRect.width / 2);

        const dy =
          sourceRect.top +
          sourceRect.height / 2 -
          (popupRect.top + popupRect.height / 2);

        const scaleX = Math.max(
          sourceRect.width / popupRect.width,
          0.25
        );

        const scaleY = Math.max(
          sourceRect.height / popupRect.height,
          0.25
        );

        expandTl = gsap.timeline();

        expandTl
          .fromTo(
            card,
            {
              x: dx,
              y: dy,
              scaleX: scaleX,
              scaleY: scaleY,
              opacity: 0.6,
              borderRadius: "16px",
            },
            {
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              borderRadius: "1.5em",
              duration: 0.65,
              ease: "back.out(1.4)",
            },
            0
          )
          .fromTo(
            [
              nameEl,
              roleEl,
              Array.from(bodyEl.children),
              Array.from(socialsEl.children),
            ],
            {
              opacity: 0,
              y: 18,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.04,
              ease: "power2.out",
            },
            0.18
          )
          .fromTo(
            closeBtn,
            {
              scale: 0,
              opacity: 0,
              rotation: -90,
            },
            {
              scale: 1,
              opacity: 1,
              rotation: 0,
              duration: 0.45,
              ease: "back.out(2.5)",
            },
            0.3
          );
      }

      function closeTeamPopup() {
        if (!isOpen) return;

        if (expandTl) expandTl.kill();

        expandTl = gsap.timeline({
          onComplete: () => {
            overlay.classList.remove("is-active");
            overlay.style.display = "none";
            isOpen = false;

            gsap.set(
              [card, nameEl, roleEl, bodyEl, socialsEl, closeBtn],
              {
                opacity: 1,
                clearProps: "all",
              }
            );
          },
        });

        expandTl.to(
          card,
          {
            scale: 0.88,
            opacity: 0,
            duration: 0.28,
            ease: "power2.inOut",
          },
          0
        );
      }

      teamCards.forEach((cardEl, idx) => {
        cardEl.addEventListener("click", () => {
          openTeamPopup(cardEl, idx);
        });
      });

      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeTeamPopup();
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          closeTeamPopup();
        }
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) {
          closeTeamPopup();
        }
      });

      window.__two26TeamPopup = {
        open: openTeamPopup,
        close: closeTeamPopup,
        isOpen: () => isOpen,
      };
    }

    function safeInit() {
      if (typeof gsap !== "undefined") {
        initTwo26TeamPopup();
      } else {
        let count = 0;

        const checkGsap = setInterval(() => {
          count++;

          if (typeof gsap !== "undefined") {
            clearInterval(checkGsap);
            initTwo26TeamPopup();
          } else if (count > 40) {
            clearInterval(checkGsap);
          }
        }, 80);
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", safeInit);
    } else {
      safeInit();
    }

    window.addEventListener("load", safeInit);

    if (window.Webflow) {
      window.Webflow.push(function () {
        safeInit();
      });
    }
  })();

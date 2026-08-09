import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PinterestIcon from "@mui/icons-material/Pinterest";
import GitHubIcon from "@mui/icons-material/GitHub";
import TelegramIcon from "@mui/icons-material/Telegram";
import LanguageIcon from "@mui/icons-material/Language";

export const SOCIAL_ICON_MAP = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  whatsapp: WhatsAppIcon,
  pinterest: PinterestIcon,
  github: GitHubIcon,
  telegram: TelegramIcon,
  custom: LanguageIcon,
};

export const SOCIAL_PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "pinterest", label: "Pinterest" },
  { value: "github", label: "GitHub" },
  { value: "telegram", label: "Telegram" },
  { value: "custom", label: "Other / Custom" },
];

export const getSocialIcon = (platform) => SOCIAL_ICON_MAP[platform] || LanguageIcon;
